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

type Metadata = BgioServer.MatchData;
type PlayerMetadata = Metadata['players'][number];

export interface HostAwareStore {
  setHost?(matchID: string, hostUserId: string | undefined): Promise<void>;
  hostUserId?(matchID: string): string | undefined;
}

interface Rematch {
  fromMatchID: string;
  createdAt: number;
  originalHostUserId?: string;
  hostDeclined: boolean;
  hostResolved: boolean;
  /** Seats in the order they were taken, with the verified identity at join time. */
  joins: { seat: string; userId?: string }[];
}

interface Ctx {
  method: string;
  path: string;
  status: number;
  body: unknown;
  req: NodeJS.ReadableStream;
  request: { body?: unknown };
  throw(status: number, message?: string): never;
  app: { context: { db: StorageAPI.Async | StorageAPI.Sync; auth: Auth } };
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

export function createRematchRules(store: HostAwareStore, { hostGraceMs = DEFAULT_HOST_GRACE_MS, now = Date.now } = {}) {
  const rematches = new Map<string, Rematch>();
  const declinedBeforeRematch = new Set<string>();
  let tail: Promise<unknown> = Promise.resolve();

  const serialize = <T>(run: () => Promise<T>): Promise<T> => {
    const result = tail.then(run);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };

  const fetchMetadata = async (ctx: Ctx, matchID: string) =>
    (await ctx.app.context.db.fetch(matchID, { metadata: true })).metadata as Metadata | undefined;

  /** Original host declined: the earliest seated joiner (if any) takes the host seat. */
  async function resolveDecline(ctx: Ctx, matchID: string, rematch: Rematch) {
    rematch.hostDeclined = true;
    if (rematch.hostResolved) return;
    const metadata = await fetchMetadata(ctx, matchID);
    if (!metadata || isSeated(metadata.players[Number(REMATCH_HOST_SEAT)])) return;
    const first = rematch.joins.find(({ seat }) => seat !== REMATCH_HOST_SEAT && isSeated(metadata.players[Number(seat)]));
    if (!first) return;
    const from = metadata.players[Number(first.seat)];
    metadata.players[Number(REMATCH_HOST_SEAT)] = {
      ...from,
      id: Number(REMATCH_HOST_SEAT),
      // The promoted client finds its new seat through this marker.
      data: { ...(from.data as object | undefined), promotedFromSeat: first.seat },
    };
    metadata.players[Number(first.seat)] = { id: Number(first.seat) };
    await ctx.app.context.db.setMetadata(matchID, metadata);
    rematch.hostResolved = true;
    await store.setHost?.(matchID, first.userId);
  }

  async function expireGrace(ctx: Ctx, matchID: string) {
    const rematch = rematches.get(matchID);
    if (!rematch || rematch.hostResolved || rematch.hostDeclined) return;
    if (now() - rematch.createdAt < hostGraceMs) return;
    await resolveDecline(ctx, matchID, rematch);
  }

  async function playAgain(ctx: Ctx, next: Next, fromMatchID: string) {
    // The next match inherits the original host, member or guest.
    const originalHostUserId = store.hostUserId?.(fromMatchID);
    await hostIdentity.run({ userId: originalHostUserId }, next);
    const nextMatchID = (ctx.body as { nextMatchID?: string } | undefined)?.nextMatchID;
    if (ctx.status !== 200 || !nextMatchID || rematches.has(nextMatchID)) return;
    rematches.set(nextMatchID, {
      fromMatchID,
      createdAt: now(),
      originalHostUserId,
      hostDeclined: declinedBeforeRematch.has(fromMatchID),
      hostResolved: false,
      joins: [],
    });
  }

  async function join(ctx: Ctx, matchID: string, rematch: Rematch) {
    await expireGrace(ctx, matchID);
    const body = await readJson(ctx.req);
    ctx.request.body = body;
    const playerName = typeof body.playerName === 'string' ? body.playerName : '';
    if (!playerName) ctx.throw(403, 'playerName is required');
    const metadata = await fetchMetadata(ctx, matchID);
    if (!metadata) ctx.throw(404, 'Match ' + matchID + ' not found');
    const open = (seat: string) => metadata.players[Number(seat)] !== undefined && !isSeated(metadata.players[Number(seat)]);
    const requested = body.playerID === undefined || body.playerID === null ? undefined : String(body.playerID);

    let seat: string | undefined;
    if (rematch.hostDeclined && open(REMATCH_HOST_SEAT)) {
      seat = REMATCH_HOST_SEAT; // first joiner after a decline becomes host
    } else if (requested !== undefined && open(requested)) {
      seat = requested; // keep the previous seat; seat 0 is the original host's
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
    await ctx.app.context.db.setMetadata(matchID, metadata);

    const userId = currentHostUserId();
    rematch.joins.push({ seat, userId });
    if (seat === REMATCH_HOST_SEAT) {
      rematch.hostResolved = true;
      // The original host keeps the inherited identity; a successor's own
      // verified identity (or none, for a guest) decides persistence.
      if (rematch.hostDeclined) await store.setHost?.(matchID, userId);
    }
    ctx.body = { playerID: seat, playerCredentials };
  }

  async function decline(ctx: Ctx, fromMatchID: string) {
    const body = await readJson(ctx.req);
    const playerID = body.playerID === undefined ? undefined : String(body.playerID);
    const credentials = typeof body.credentials === 'string' ? body.credentials : undefined;
    const metadata = await fetchMetadata(ctx, fromMatchID);
    if (!metadata) ctx.throw(404, 'Match ' + fromMatchID + ' not found');
    if (playerID === undefined || !metadata.players[Number(playerID)]) ctx.throw(404, 'Player not found');
    const authentic = await ctx.app.context.auth.authenticateCredentials({ playerID, credentials, metadata });
    if (!authentic) ctx.throw(403, 'Invalid credentials');
    if (playerID === REMATCH_HOST_SEAT) {
      declinedBeforeRematch.add(fromMatchID);
      const nextMatchID = metadata.nextMatchID;
      const rematch = nextMatchID ? rematches.get(nextMatchID) : undefined;
      if (nextMatchID && rematch) await resolveDecline(ctx, nextMatchID, rematch);
    }
    ctx.status = 200;
    ctx.body = {};
  }

  return {
    /**
     * Mount on the lobby router before boardgame.io adds its routes (they are
     * added in `server.run()`), so these run first and behind its CORS layer.
     */
    register(router: Router) {
      router.post('/games/:name/:id/playAgain', (ctx, next) => serialize(() => playAgain(ctx, next, ctx.params.id)));
      router.post('/games/:name/:id/declineRematch', (ctx) => serialize(() => decline(ctx, ctx.params.id)));
      router.post('/games/:name/:id/join', (ctx, next) => {
        const rematch = rematches.get(ctx.params.id);
        return rematch ? serialize(() => join(ctx, ctx.params.id, rematch)) : next();
      });
      // Lobby polling of a rematch room settles an expired host grace period.
      router.get('/games/:name/:id', async (ctx, next) => {
        if (rematches.has(ctx.params.id)) await serialize(() => expireGrace(ctx, ctx.params.id));
        return next();
      });
    },
  };
}
