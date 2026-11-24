import { AsyncLocalStorage } from 'node:async_hooks';
import type { Server as BgioServer, StorageAPI } from 'boardgame.io';
import { currentHostUserId, hostIdentity } from './persistence/hostToken';

/**
 * Rematch host and seat rules (DB-P4), applied on top of boardgame.io's
 * playAgain and join routes:
 *
 * - playAgain creates the next match under the original match's host
 *   identity, so a member-hosted table stays member-hosted.
 * - In the next match every player rejoins their previous seat; seat 0 (the
 *   host seat) stays reserved for the original host.
 * - If the original host declines (POST declineRematch from seat 0 of the
 *   finished match, or no host join within the grace period), the first
 *   player to join the next match becomes host: an already-seated earliest
 *   joiner moves to seat 0, otherwise the next joiner is seated there.
 * - Persistence follows the resulting host (member-only rule).
 *
 * playAgain, joins into rematch rooms and declines all run through one
 * serialized queue (the playAgain serialization this server already had), so
 * concurrent joins have exactly one winner.
 */

export const REMATCH_HOST_SEAT = '0';
export const DEFAULT_HOST_GRACE_MS = 2 * 60 * 1000;

// boardgame.io spreads lobby metadata into public responses. Symbols keep
// server-only fields out of that JSON, including join-time member identities.
export const REMATCH = Symbol('rematch');
export const REMATCH_DECLINED = Symbol('rematch declined');
export const REMATCH_HOST_CHANGE = Symbol('rematch host change');
export type RematchMetadata = BgioServer.MatchData & {
  [REMATCH]?: Rematch;
  [REMATCH_DECLINED]?: true;
  [REMATCH_HOST_CHANGE]?: { userId?: string };
};

type Metadata = RematchMetadata;
type PlayerMetadata = Metadata['players'][number];
type MatchStore = StorageAPI.Async | StorageAPI.Sync;

interface HostAwareStore {
  hostUserId?(matchID: string): string | undefined;
}

export interface Rematch {
  fromMatchID: string;
  createdAt: number;
  hostDeclined: boolean;
  hostResolved: boolean;
  /** Join order, with the credential identifying each seat's occupant. */
  joins: { seat: string; credential: string; userId?: string }[];
}

interface Ctx {
  status: number;
  body: unknown;
  req: NodeJS.ReadableStream;
  throw(status: number, message?: string): never;
  app: { context: { auth: Auth } };
}
interface Auth {
  generateCredentials(ctx: unknown): Promise<string> | string;
  authenticateCredentials(args: { playerID: string; credentials?: string; metadata: Metadata }): Promise<boolean> | boolean;
}
type Next = () => Promise<unknown>;

type RouteCtx = Ctx & { params: Record<string, string> };
interface Router {
  post(path: string, handler: (ctx: RouteCtx, next: Next) => Promise<unknown>): unknown;
  get(path: string, handler: (ctx: RouteCtx, next: Next) => Promise<unknown>): unknown;
}

async function readJson(req: NodeJS.ReadableStream, limit = 64 * 1024): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += buffer.length;
    if (size > limit) throw Object.assign(new Error('Request body too large'), { status: 413 });
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  const parsed: unknown = JSON.parse(text);
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
}

const isSeated = (player: PlayerMetadata | undefined) => Boolean(player?.name);

export function createRematchRules(
  db: MatchStore & HostAwareStore,
  { hostGraceMs = DEFAULT_HOST_GRACE_MS, now = Date.now } = {},
) {
  const creatingRematch = new AsyncLocalStorage<Rematch>();
  const createMatch = db.createMatch.bind(db);
  db.createMatch = (matchID, options) => {
    const rematch = creatingRematch.getStore();
    if (rematch) (options.metadata as Metadata)[REMATCH] = rematch;
    return createMatch(matchID, options);
  };
  let tail: Promise<unknown> = Promise.resolve();

  const serialize = <T>(run: () => Promise<T>): Promise<T> => {
    const result = tail.then(run);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };

  const fetchMetadata = async (matchID: string) =>
    (await db.fetch(matchID, { metadata: true })).metadata as Metadata | undefined;

  const authentic = async (ctx: Ctx, metadata: Metadata, playerID: string, credential: unknown) =>
    typeof credential === 'string' &&
    Boolean(metadata.players[Number(playerID)]?.credentials) &&
    await ctx.app.context.auth.authenticateCredentials({ playerID, credentials: credential, metadata });

  /** Original host declined: the earliest seated joiner (if any) takes the host seat. */
  async function resolveDecline(matchID: string, metadata: Metadata, rematch: Rematch) {
    if (rematch.hostResolved || rematch.hostDeclined) return;
    rematch.hostDeclined = true;
    const first = rematch.joins.find(({ seat, credential }) => metadata.players[Number(seat)]?.credentials === credential);
    if (first) {
      const from = metadata.players[Number(first.seat)];
      metadata.players[Number(REMATCH_HOST_SEAT)] = {
        ...from,
        id: Number(REMATCH_HOST_SEAT),
        // The promoted client uses this marker to request credential verification.
        data: { ...(from.data as object | undefined), promotedFromSeat: first.seat },
      };
      metadata.players[Number(first.seat)] = { id: Number(first.seat) };
      rematch.hostResolved = true;
      rematch.joins = [];
      metadata[REMATCH_HOST_CHANGE] = { userId: first.userId };
    }
    await db.setMetadata(matchID, metadata);
  }

  async function expireGrace(matchID: string, metadata: Metadata, rematch: Rematch) {
    if (now() - rematch.createdAt >= hostGraceMs) await resolveDecline(matchID, metadata, rematch);
  }

  async function playAgain(ctx: Ctx, next: Next, fromMatchID: string) {
    const previous = await fetchMetadata(fromMatchID);
    if (!previous) ctx.throw(404, 'Match ' + fromMatchID + ' not found');
    return hostIdentity.run({ userId: db.hostUserId?.(fromMatchID) }, () => creatingRematch.run({
      fromMatchID,
      createdAt: now(),
      hostDeclined: previous[REMATCH_DECLINED] === true,
      hostResolved: false,
      joins: [],
    }, next));
  }

  async function join(ctx: Ctx, matchID: string, metadata: Metadata, rematch: Rematch) {
    await expireGrace(matchID, metadata, rematch);
    const body = await readJson(ctx.req);
    const playerName = typeof body.playerName === 'string' ? body.playerName : '';
    if (!playerName) ctx.throw(403, 'playerName is required');
    const open = (seat: string) => String(Number(seat)) === seat &&
      metadata.players[Number(seat)] !== undefined && !isSeated(metadata.players[Number(seat)]);
    const requested = body.playerID === undefined || body.playerID === null ? undefined : String(body.playerID);

    let seat: string | undefined;
    if (rematch.hostDeclined && open(REMATCH_HOST_SEAT)) {
      seat = REMATCH_HOST_SEAT; // first joiner after a decline becomes host
    } else if (requested !== undefined && open(requested)) {
      if (requested === REMATCH_HOST_SEAT) {
        const previous = await fetchMetadata(rematch.fromMatchID);
        if (!previous || !await authentic(ctx, previous, REMATCH_HOST_SEAT, body.rematchCredentials)) {
          ctx.throw(403, 'The rematch host seat is reserved for the original host');
        }
      }
      seat = requested;
    } else {
      seat = Object.keys(metadata.players).find(
        (id) => (rematch.hostDeclined || id !== REMATCH_HOST_SEAT) && open(id),
      );
    }
    if (seat === undefined) ctx.throw(409, `Match ${matchID} has no seat available`);

    const player = metadata.players[Number(seat)];
    if (body.data !== undefined) player.data = body.data;
    player.name = playerName;
    const playerCredentials = await ctx.app.context.auth.generateCredentials(ctx);
    player.credentials = playerCredentials;
    if (seat === REMATCH_HOST_SEAT && rematch.hostDeclined) {
      metadata[REMATCH_HOST_CHANGE] = { userId: currentHostUserId() };
    }

    if (!rematch.hostResolved) {
      if (seat === REMATCH_HOST_SEAT) {
        rematch.hostResolved = true;
        rematch.joins = [];
      } else {
        rematch.joins.push({ seat, credential: playerCredentials, userId: currentHostUserId() });
      }
    }
    await db.setMetadata(matchID, metadata);
    ctx.body = { playerID: seat, playerCredentials };
  }

  async function decline(ctx: Ctx, fromMatchID: string) {
    const body = await readJson(ctx.req);
    const playerID = body.playerID === undefined ? undefined : String(body.playerID);
    const metadata = await fetchMetadata(fromMatchID);
    if (!metadata) ctx.throw(404, 'Match ' + fromMatchID + ' not found');
    if (playerID === undefined || !metadata.players[Number(playerID)]) ctx.throw(404, 'Player not found');
    if (!await authentic(ctx, metadata, playerID, body.credentials)) ctx.throw(403, 'Invalid credentials');
    if (playerID === REMATCH_HOST_SEAT) {
      const nextMatchID = metadata.nextMatchID;
      if (nextMatchID) {
        const next = await fetchMetadata(nextMatchID);
        const rematch = next?.[REMATCH];
        if (next && rematch) await resolveDecline(nextMatchID, next, rematch);
      } else {
        metadata[REMATCH_DECLINED] = true;
        await db.setMetadata(fromMatchID, metadata);
      }
    }
    ctx.status = 200;
    ctx.body = {};
  }

  async function recoverPromotedSeat(ctx: Ctx, matchID: string) {
    const { playerID, credentials } = await readJson(ctx.req);
    const metadata = await fetchMetadata(matchID);
    const host = metadata?.players[Number(REMATCH_HOST_SEAT)];
    if (metadata?.[REMATCH] && host?.data?.promotedFromSeat === playerID &&
        typeof playerID === 'string' && await authentic(ctx, metadata, REMATCH_HOST_SEAT, credentials)) {
      ctx.body = { playerID: REMATCH_HOST_SEAT };
    } else {
      ctx.throw(403, 'No matching rematch promotion');
    }
  }

  return {
    /**
     * Mount on the lobby router before boardgame.io adds its routes (they are
     * added in `server.run()`), so these run first and behind its CORS layer.
     */
    register(router: Router) {
      router.post('/games/:name/:id/playAgain', (ctx, next) => serialize(() => playAgain(ctx, next, ctx.params.id)));
      router.post('/games/:name/:id/declineRematch', (ctx) => serialize(() => decline(ctx, ctx.params.id)));
      router.post('/games/:name/:id/rematchSeat', (ctx) => recoverPromotedSeat(ctx, ctx.params.id));
      router.post('/games/:name/:id/join', (ctx, next) => serialize(async () => {
        const metadata = await fetchMetadata(ctx.params.id);
        return metadata?.[REMATCH] ? join(ctx, ctx.params.id, metadata, metadata[REMATCH]) : next();
      }));
      // Lobby polling of a rematch room settles an expired host grace period.
      router.get('/games/:name/:id', async (ctx, next) => {
        const metadata = await fetchMetadata(ctx.params.id);
        if (!metadata) ctx.throw(404, 'Match ' + ctx.params.id + ' not found');
        const rematch = metadata[REMATCH];
        if (rematch && !rematch.hostResolved && !rematch.hostDeclined) {
          await serialize(() => expireGrace(ctx.params.id, metadata, rematch));
        }
        return next();
      });
    },
  };
}
