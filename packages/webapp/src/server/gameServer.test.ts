import { randomBytes } from 'node:crypto';
import type { Game } from 'boardgame.io';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import game from '@/game';
import { playerView } from '@/game/core/playerView';
import { FakeMatchesSql } from './persistence/fakeMatchesSql';
import { issueTestHostToken } from './persistence/testHostToken';
import { startGameServer, type RunningGameServer } from './gameServer';

jest.mock('@sentry/node', () => ({ captureException: jest.fn(), init: jest.fn(), flush: jest.fn() }));

// Throwaway secret per run, never written anywhere.
const SECRET = randomBytes(32).toString('base64url');
const secretBytes = new TextEncoder().encode(SECRET);
const MEMBER_ENV = { MATCH_PERSISTENCE: 'member', DATABASE_URL: 'postgres://unused@127.0.0.1:1/unused', GAME_SERVER_AUTH_SECRET: SECRET };

const counter: Game<{ n: number }> = {
  name: 'counter',
  minPlayers: 2,
  maxPlayers: 4,
  setup: () => ({ n: 0 }),
  moves: { bump: ({ G }) => { G.n += 1; } },
};

const servers: RunningGameServer[] = [];
const clients: { stop(): void }[] = [];

async function start(games: Game[], env: Record<string, string | undefined>, sql?: FakeMatchesSql) {
  const running = await startGameServer({
    games,
    port: 0,
    origins: [],
    env,
    storeOverrides: sql ? { sql, endGameRetryDelaysMs: [1], backgroundRetryMs: 30, backgroundRetryMaxMs: 60 } : {},
  });
  servers.push(running);
  const url = `http://localhost:${running.port}`;
  return { running, url, lobby: new LobbyClient({ server: url }) };
}

function connect(url: string, gameDef: Game, matchID: string, playerID: string | undefined, credentials?: string) {
  const client = Client({ game: gameDef, matchID, playerID, credentials, multiplayer: SocketIO({ server: url }) });
  client.start();
  clients.push(client);
  return client;
}

async function until(check: () => boolean | Promise<boolean>, timeoutMs = 4_000, label = check.toString()) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`condition not met in time: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function seatTwo(lobby: LobbyClient, gameName: string, matchID: string) {
  const a = await lobby.joinMatch(gameName, matchID, { playerID: '0', playerName: 'Alice' });
  const b = await lobby.joinMatch(gameName, matchID, { playerID: '1', playerName: 'Bob' });
  return [a.playerCredentials, b.playerCredentials];
}

const health = async (url: string) => ((await (await fetch(`${url}/health`)).json()) as { persistence: string }).persistence;

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(async () => {
  clients.splice(0).forEach((client) => client.stop());
  await Promise.all(servers.splice(0).map((running) => running.stop(1_000)));
  jest.restoreAllMocks();
});

describe('health and switch (DB-A5)', () => {
  it('reports off with no DATABASE_URL and with MATCH_PERSISTENCE=off', async () => {
    expect(await health((await start([counter], {})).url)).toBe('off');
    expect(await health((await start([counter], { ...MEMBER_ENV, MATCH_PERSISTENCE: 'off' })).url)).toBe('off');
  });

  it('reports on with a reachable database, and degraded after mid-run loss while the table keeps playing', async () => {
    const sql = new FakeMatchesSql();
    const { url, lobby } = await start([counter], MEMBER_ENV, sql);
    expect(await health(url)).toBe('on');
    const token = await issueTestHostToken(secretBytes, { sub: 'member-1' });
    const { matchID } = await lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    const [cred] = await seatTwo(lobby, 'counter', matchID);
    const alice = connect(url, counter, matchID, '0', cred);
    await until(() => Boolean(alice.getState()?.isConnected));

    sql.failAll = true;
    alice.moves.bump();
    await until(() => alice.getState()!._stateID === 1);
    alice.moves.bump();
    await until(() => alice.getState()!._stateID === 2);
    expect(alice.getState()!.G.n).toBe(2);
    expect(await health(url)).toBe('degraded');

    sql.failAll = false;
    alice.moves.bump();
    await until(() => sql.rows.get(matchID)?.state_id === 3);
    expect(await health(url)).toBe('on');
  });
});

describe('member host on create (DB-A1, DB-C1)', () => {
  it('stores only a verified member host and ignores body identity', async () => {
    const sql = new FakeMatchesSql();
    const { lobby } = await start([counter], MEMBER_ENV, sql);
    const valid = await issueTestHostToken(secretBytes, { sub: 'member-1' });
    const wrongAud = await issueTestHostToken(secretBytes, { sub: 'member-2', aud: 'elsewhere' });
    const forgedBody = { numPlayers: 2, hostUserId: 'forged', setupData: { hostUserId: 'forged' } };

    const member = await lobby.createMatch('counter', forgedBody, { headers: { Authorization: `Bearer ${valid}` } });
    const invalid = await lobby.createMatch('counter', forgedBody, { headers: { Authorization: `Bearer ${wrongAud}` } });
    const guest = await lobby.createMatch('counter', forgedBody);

    expect(sql.rows.get(member.matchID)?.host_user_id).toBe('member-1');
    // Invalid token: still HTTP 200 (createMatch resolved), but a guest match with no row.
    expect(sql.rows.has(invalid.matchID)).toBe(false);
    expect(sql.rows.has(guest.matchID)).toBe(false);
    expect(Array.from(sql.rows.values()).map((row) => row.host_user_id)).not.toContain('forged');
  });
});

describe('restart restore (DB-A2)', () => {
  it('restores a member-hosted match with the original seat credentials; a guest match is gone', async () => {
    const sql = new FakeMatchesSql();
    const first = await start([counter], MEMBER_ENV, sql);
    const token = await issueTestHostToken(secretBytes, { sub: 'member-1' });
    const { matchID } = await first.lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    const guestMatch = await first.lobby.createMatch('counter', { numPlayers: 2 });
    const [credA, credB] = await seatTwo(first.lobby, 'counter', matchID);
    const alice = connect(first.url, counter, matchID, '0', credA);
    await until(() => Boolean(alice.getState()?.isConnected));
    alice.moves.bump();
    await until(() => sql.rows.get(matchID)?.state_id === 1);
    clients.splice(0).forEach((client) => client.stop());
    await first.running.stop(1_000);

    const second = await start([counter], MEMBER_ENV, sql);
    const restoredAlice = connect(second.url, counter, matchID, '0', credA);
    await until(() => restoredAlice.getState()?.G.n === 1);
    // Both guests (seat holders) still move with their original credentials.
    restoredAlice.moves.bump();
    await until(() => restoredAlice.getState()!.G.n === 2);
    restoredAlice.events.endTurn!();
    const restoredBob = connect(second.url, counter, matchID, '1', credB);
    await until(() => restoredBob.getState()?.ctx.currentPlayer === '1');
    restoredBob.moves.bump();
    await until(() => restoredBob.getState()!.G.n === 3);
    await until(() => sql.rows.get(matchID)?.state_id === restoredBob.getState()!._stateID);
    // The restored metadata still enforces the original credentials.
    await expect(second.lobby.updatePlayer('counter', matchID, { playerID: '1', credentials: 'not-the-credential', newName: 'Mallory' }))
      .rejects.toThrow();
    await second.lobby.updatePlayer('counter', matchID, { playerID: '1', credentials: credB, newName: 'Bobby' });

    await expect(second.lobby.getMatch('counter', guestMatch.matchID)).rejects.toThrow();
  });
});

it('closes an open lobby event stream before flushing pending writes', async () => {
  const sql = new FakeMatchesSql();
  const { running, url, lobby } = await start([counter], MEMBER_ENV, sql);
  const token = await issueTestHostToken(secretBytes, { sub: 'member-1' });
  const { matchID } = await lobby.createMatch('counter', {}, { headers: { Authorization: `Bearer ${token}` } });
  const state = (await running.server.db.fetch(matchID, { state: true })).state;
  sql.failNext();
  await running.server.db.setState(matchID, { ...state, _stateID: 1 });
  expect(sql.rows.get(matchID)?.state_id).toBe(0);

  const abort = new AbortController();
  try {
    const stream = await fetch(`${url}/lobby/updates`, { signal: abort.signal });
    expect(stream.headers.get('content-type')).toContain('text/event-stream');
    await expect(running.stop(500)).resolves.toBe(true);
    expect(sql.rows.get(matchID)?.state_id).toBe(1);
  } finally {
    abort.abort();
  }
});

describe('client prediction and reconciliation (DB-C5, DB-C7)', () => {
  it('predicts a public move before the delayed server result, then matches the server', async () => {
    const sql = new FakeMatchesSql();
    const { url, lobby, running } = await start([counter], MEMBER_ENV, sql);
    const token = await issueTestHostToken(secretBytes, { sub: 'member-1' });
    const { matchID } = await lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    const [credA, credB] = await seatTwo(lobby, 'counter', matchID);
    const alice = connect(url, counter, matchID, '0', credA);
    const bob = connect(url, counter, matchID, '1', credB);
    await until(() => Boolean(alice.getState()?.isConnected && bob.getState()?.isConnected));

    sql.writeDelayMs = 200;
    alice.moves.bump();
    // Predicted right after the action is sent, before the server result.
    expect(alice.getState()!.G.n).toBe(1);
    expect(bob.getState()!.G.n).toBe(0);
    await until(() => bob.getState()!.G.n === 1);
    const server = await running.persistence.store!.fetch(matchID, { state: true });
    expect(alice.getState()!.G).toEqual(server.state.G);
    expect(alice.getState()!._stateID).toBe(server.state._stateID);

    // Hard reject: PostgreSQL is ahead. The predicting client reconciles to it.
    sql.writeDelayMs = 0;
    const row = sql.rows.get(matchID)!;
    row.state_id = 50;
    Object.assign(row.state as object, { G: { n: 40 }, _stateID: 50 });
    alice.moves.bump();
    expect(alice.getState()!.G.n).toBe(2);
    await until(() => alice.getState()!.G.n === 40);
    expect(alice.getState()!._stateID).toBe(50);
    // The rejected move was never published to the other seat.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bob.getState()!.G.n).toBe(1);
  });

  it('runs hidden-info OSV moves only on the server and reveals no other hand (DB-C5-H)', async () => {
    const { url, lobby, running } = await start([game], {});
    const { matchID } = await lobby.createMatch(game.name!, { numPlayers: 2 });
    const [credA, credB] = await seatTwo(lobby, game.name!, matchID);
    const alice = connect(url, game, matchID, '0', credA);
    const bob = connect(url, game, matchID, '1', credB);
    await until(() => Boolean(alice.getState()?.isConnected && bob.getState()?.isConnected));
    const before = alice.getState()!;

    alice.moves.endActionTurn();
    // client: false — nothing runs locally; the state is unchanged until the broadcast.
    expect(alice.getState()!._stateID).toBe(before._stateID);
    expect(alice.getState()!.ctx.currentPlayer).toBe('0');
    await until(() => alice.getState()!.ctx.currentPlayer === '1');

    const server = (await running.server.db.fetch(matchID, { state: true })).state;
    for (const [client, seat] of [[alice, '0'], [bob, '1']] as const) {
      await until(() => client.getState()!._stateID === server._stateID);
      expect(client.getState()!.G).toEqual(playerView({ G: server.G, ctx: server.ctx, playerID: seat }));
      const other = seat === '0' ? '1' : '0';
      expect((client.getState()!.G as { players: Record<string, { hand?: unknown }> }).players[other].hand).toBeUndefined();
      expect((client.getState()!.G as { decks?: unknown }).decks).toBeUndefined();
    }
  });
});

describe('end-game persistence status (DB-C9)', () => {
  it('reports an unsaved end-game state for a member table until a background retry lands', async () => {
    const sql = new FakeMatchesSql();
    const { url, lobby } = await start([counter], MEMBER_ENV, sql);
    const token = await issueTestHostToken(secretBytes, { sub: 'member-1' });
    const { matchID } = await lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    const guest = await lobby.createMatch('counter', { numPlayers: 2 });
    const [cred] = await seatTwo(lobby, 'counter', matchID);
    const [guestCred] = await seatTwo(lobby, 'counter', guest.matchID);
    const alice = connect(url, counter, matchID, '0', cred);
    const guestAlice = connect(url, counter, guest.matchID, '0', guestCred);
    await until(() => Boolean(alice.getState()?.isConnected && guestAlice.getState()?.isConnected));
    const status = async (id: string) =>
      ((await (await fetch(`${url}/games/counter/${id}/persistence`)).json()) as { endGameUnsaved: boolean }).endGameUnsaved;

    // A mid-game failure never shows the warning.
    sql.failNext(1);
    alice.moves.bump();
    await until(() => alice.getState()!._stateID === 1);
    expect(await status(matchID)).toBe(false);

    // End-game write and its retry fail.
    sql.failNext(2);
    alice.events.endGame!({ winners: ['0'] });
    await until(() => Boolean(alice.getState()!.ctx.gameover));
    expect(await status(matchID)).toBe(true);
    await until(async () => !(await status(matchID)));
    expect(sql.rows.get(matchID)?.is_gameover).toBe(true);

    sql.failAll = true;
    guestAlice.events.endGame!({ winners: ['0'] });
    await until(() => Boolean(guestAlice.getState()!.ctx.gameover));
    expect(await status(guest.matchID)).toBe(false);
  });
});
