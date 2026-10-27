import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { getBotStrategy, type BotSeatData } from './game/bots/seat';
import { DEFAULT_BOT_STRATEGY, isBotStrategy, pickBotName } from './game/bots/strategies';

export const ADD_BOT_PATH = '/games/:name/:id/bots';
/** Bot seat credentials carry this prefix; players cannot choose their own credentials, so it marks server-made bots. */
export const BOT_CREDENTIAL_PREFIX = 'bot:';

/**
 * True only for seats this server made into bots. Players can write any
 * `data` to their own seat, so `data.bot` alone is not trusted on the server.
 */
export function isServerBotSeat(player: { data?: unknown; credentials?: string }): boolean {
  return getBotStrategy(player.data) !== undefined && Boolean(player.credentials?.startsWith(BOT_CREDENTIAL_PREFIX));
}
export const REMOVE_BOT_PATH = '/games/:name/:id/bots/:seat/remove';

interface PlayerMetadata {
  id: number;
  name?: string;
  credentials?: string;
  data?: unknown;
  isConnected?: boolean;
}

interface MatchMetadata {
  gameName: string;
  players: Record<number, PlayerMetadata>;
  setupData?: unknown;
  gameover?: unknown;
}

export interface BotSeatStore {
  fetch(matchID: string, opts: { metadata: true }): unknown;
  setMetadata(matchID: string, metadata: MatchMetadata): unknown;
}

interface BotSeatContext {
  params: Record<string, string>;
  req: IncomingMessage;
  status: number;
  body: unknown;
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw || '{}');
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const fail = (ctx: BotSeatContext, status: number, error: string) => {
  ctx.status = status;
  ctx.body = { error };
};

/**
 * Loads the match and checks the request comes from the host (seat 0) of a
 * Standard room that has not started. Returns the metadata, or responds with
 * an error and returns undefined.
 */
async function hostMatch(ctx: BotSeatContext, db: BotSeatStore, gameName: string, body: Record<string, unknown>) {
  if (ctx.params.name !== gameName) return fail(ctx, 404, 'Unknown game');
  const { metadata } = ((await db.fetch(ctx.params.id, { metadata: true })) ?? {}) as { metadata?: MatchMetadata };
  if (!metadata) return fail(ctx, 404, 'Match not found');
  const host = metadata.players[0];
  if (body.playerID !== '0' || typeof body.credentials !== 'string' || !host?.credentials || body.credentials !== host.credentials) {
    return fail(ctx, 403, 'Only the host can manage bots');
  }
  if ((host.data as { started?: unknown } | undefined)?.started === true || metadata.gameover !== undefined) {
    return fail(ctx, 409, 'The game has already started');
  }
  if ((metadata.setupData as { ruleset?: unknown } | undefined)?.ruleset !== 'tree-poc-v1') {
    return fail(ctx, 400, 'Bots can only play Standard rooms');
  }
  return metadata;
}

function seatOf(metadata: MatchMetadata, value: unknown): PlayerMetadata | undefined {
  const seat = Number(value);
  return Number.isInteger(seat) && seat > 0 ? metadata.players[seat] : undefined;
}

/** POST /games/:name/:id/bots — host seats a bot; body { playerID, credentials, seat, strategy? }. */
export function addBotHandler(db: BotSeatStore, gameName: string) {
  return async (ctx: BotSeatContext) => {
    const body = await readJson(ctx.req);
    const metadata = await hostMatch(ctx, db, gameName, body);
    if (!metadata) return;
    const strategy = body.strategy ?? DEFAULT_BOT_STRATEGY;
    if (!isBotStrategy(strategy)) return fail(ctx, 400, 'Unknown bot strategy');
    const seat = seatOf(metadata, body.seat);
    if (!seat) return fail(ctx, 400, 'Invalid seat');
    if (seat.name?.trim()) return fail(ctx, 409, 'That seat is taken');

    const taken = Object.values(metadata.players).map(p => p.name ?? '').filter(Boolean);
    const name = pickBotName(strategy, taken);
    const data: BotSeatData = { bot: { strategy } };
    // The credential never leaves the server: the lobby strips credentials and the bot runner reads it here.
    metadata.players[seat.id] = { ...seat, name, credentials: `${BOT_CREDENTIAL_PREFIX}${randomUUID()}`, data };
    await db.setMetadata(ctx.params.id, metadata);
    ctx.body = { seat: seat.id, name, strategy };
  };
}

/** POST /games/:name/:id/bots/:seat/remove — host frees a bot seat; body { playerID, credentials }. */
export function removeBotHandler(db: BotSeatStore, gameName: string) {
  return async (ctx: BotSeatContext) => {
    const body = await readJson(ctx.req);
    const metadata = await hostMatch(ctx, db, gameName, body);
    if (!metadata) return;
    const seat = seatOf(metadata, ctx.params.seat);
    if (!seat) return fail(ctx, 400, 'Invalid seat');
    if (!isServerBotSeat(seat)) return fail(ctx, 409, 'That seat is not a bot');

    metadata.players[seat.id] = { id: seat.id };
    await db.setMetadata(ctx.params.id, metadata);
    ctx.body = { seat: seat.id };
  };
}
