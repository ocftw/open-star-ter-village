import { randomBytes } from 'node:crypto';
import type { Game } from 'boardgame.io';
import { LobbyClient } from 'boardgame.io/client';
import { FakeMatchesSql } from './persistence/fakeMatchesSql';
import { issueTestHostToken } from './persistence/testHostToken';
import { startGameServer, type RunningGameServer } from './gameServer';

jest.mock('@sentry/node', () => ({ captureException: jest.fn() }));

const SECRET = randomBytes(32).toString('base64url');
const secretBytes = new TextEncoder().encode(SECRET);
const ENV = { MATCH_PERSISTENCE: 'member', DATABASE_URL: 'postgres://unused@127.0.0.1:1/unused', GAME_SERVER_AUTH_SECRET: SECRET };
const GAME = 'counter';
const counter: Game = { name: GAME, minPlayers: 2, maxPlayers: 4, setup: () => ({}), moves: {} };

let running: RunningGameServer;
let url: string;
let lobby: LobbyClient;
let sql: FakeMatchesSql;

async function boot(hostGraceMs = 60_000) {
  sql = new FakeMatchesSql();
  running = await startGameServer({ games: [counter], port: 0, origins: [], env: ENV, storeOverrides: { sql }, rematchHostGraceMs: hostGraceMs });
  url = `http://localhost:${running.port}`;
  lobby = new LobbyClient({ server: url });
}

const bearer = async (sub: string) => ({ headers: { Authorization: `Bearer ${await issueTestHostToken(secretBytes, { sub })}` } });

/** A finished 3-seat match hosted by member-1 (Alice, seat 0). */
async function finishedMatch() {
  const { matchID } = await lobby.createMatch(GAME, { numPlayers: 3 }, await bearer('member-1'));
  const seats: Record<string, string> = {};
  for (const [seat, name] of [['0', 'Alice'], ['1', 'Bob'], ['2', 'Carol']]) {
    seats[seat] = (await lobby.joinMatch(GAME, matchID, { playerID: seat, playerName: name })).playerCredentials;
  }
  return { matchID, seats };
}

const playAgain = (matchID: string, playerID: string, credentials: string) =>
  lobby.playAgain(GAME, matchID, { playerID, credentials });
const rejoin = (nextMatchID: string, playerName: string, previousSeat: string, init?: RequestInit, rematchCredentials?: string) =>
  lobby.joinMatch(GAME, nextMatchID, { playerID: previousSeat, playerName, rematchCredentials }, init);
const decline = (matchID: string, credentials: string, playerID = '0') =>
  fetch(`${url}/games/${GAME}/${matchID}/declineRematch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerID, credentials }),
  });
const seatsOf = async (matchID: string) =>
  Object.fromEntries((await lobby.getMatch(GAME, matchID)).players.filter((p) => p.name).map((p) => [String(p.id), p.name]));

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
});
afterEach(async () => {
  await running.stop(1_000);
  jest.restoreAllMocks();
});

describe('rematch keeps the host and seats (DB-P4)', () => {
  it('keeps every seat and the member host when the original host rematches', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    // A non-host opens the rematch; the host seat waits for the original host.
    const { nextMatchID } = await playAgain(matchID, '2', seats['2']);
    expect((await rejoin(nextMatchID, 'Carol', '2')).playerID).toBe('2');
    // A newcomer with no seat preference cannot take the reserved host seat.
    expect((await lobby.joinMatch(GAME, nextMatchID, { playerName: 'Dave' })).playerID).toBe('1');
    expect((await rejoin(nextMatchID, 'Alice', '0', undefined, seats['0'])).playerID).toBe('0');
    expect(await seatsOf(nextMatchID)).toEqual({ 0: 'Alice', 1: 'Dave', 2: 'Carol' });
    // Persistence follows the inherited member host.
    expect(sql.rows.get(nextMatchID)?.host_user_id).toBe('member-1');
  });

  it('serializes concurrent playAgain calls into one next match', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    const results = await Promise.all(['0', '1', '2'].map((seat) => playAgain(matchID, seat, seats[seat])));
    expect(new Set(results.map((result) => result.nextMatchID)).size).toBe(1);
  });
});

describe('host succession when the original host declines (DB-P4)', () => {
  it('promotes the first joiner to the host seat; a guest successor drops the member row', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    const { nextMatchID } = await playAgain(matchID, '1', seats['1']);
    const bob = await rejoin(nextMatchID, 'Bob', '1');
    await rejoin(nextMatchID, 'Carol', '2');
    expect(sql.rows.get(nextMatchID)?.host_user_id).toBe('member-1');
    expect((await decline(matchID, seats['0'])).status).toBe(200);
    const match = await lobby.getMatch(GAME, nextMatchID);
    expect(await seatsOf(nextMatchID)).toEqual({ 0: 'Bob', 2: 'Carol' });
    expect((match.players[0].data as { promotedFromSeat?: string }).promotedFromSeat).toBe('1');
    // Bob's credentials moved with him to the host seat.
    await expect(lobby.updatePlayer(GAME, nextMatchID, { playerID: '0', credentials: bob.playerCredentials, newName: 'Bob' }))
      .resolves.toBeUndefined();
    // Bob joined without a member token: the table is now guest-hosted, so no row.
    expect(sql.rows.has(nextMatchID)).toBe(false);
  });

  it('a different join order promotes that first joiner', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    const { nextMatchID } = await playAgain(matchID, '2', seats['2']);
    const carol = await rejoin(nextMatchID, 'Carol', '2');
    await rejoin(nextMatchID, 'Bob', '1');
    await decline(matchID, seats['0']);
    expect(await seatsOf(nextMatchID)).toEqual({ 0: 'Carol', 1: 'Bob' });
    // The promoted seat keeps the joiner's credentials.
    await expect(lobby.updatePlayer(GAME, nextMatchID, { playerID: '0', credentials: carol.playerCredentials, newName: 'Carol' }))
      .resolves.toBeUndefined();
  });

  it('after an early decline, exactly one of several concurrent joins becomes host', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    await decline(matchID, seats['0']);
    const { nextMatchID } = await playAgain(matchID, '1', seats['1']);
    const joins = await Promise.all([rejoin(nextMatchID, 'Bob', '1'), rejoin(nextMatchID, 'Carol', '2')]);
    const hosts = joins.filter((joined) => joined.playerID === '0');
    expect(hosts).toHaveLength(1);
    const other = joins.find((joined) => joined.playerID !== '0')!;
    // The other player keeps their own previous seat.
    expect(['1', '2']).toContain(other.playerID);
    expect(Object.keys(await seatsOf(nextMatchID)).sort()).toEqual(['0', other.playerID].sort());
  });

  it('a member successor keeps the table persisted under their own identity', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    await decline(matchID, seats['0']);
    const { nextMatchID } = await playAgain(matchID, '2', seats['2']);
    expect((await rejoin(nextMatchID, 'Carol', '2', await bearer('member-3'))).playerID).toBe('0');
    expect(sql.rows.get(nextMatchID)?.host_user_id).toBe('member-3');
  });

  it('only the original host can decline', async () => {
    await boot();
    const { matchID, seats } = await finishedMatch();
    const { nextMatchID } = await playAgain(matchID, '1', seats['1']);
    await rejoin(nextMatchID, 'Bob', '1');
    expect((await decline(matchID, seats['1'], '1')).status).toBe(200);
    expect((await decline(matchID, 'wrong', '0')).status).toBe(403);
    expect(await seatsOf(nextMatchID)).toEqual({ 1: 'Bob' });
  });

  it('treats a host who never returns within the grace period as declined', async () => {
    await boot(50);
    const { matchID, seats } = await finishedMatch();
    const { nextMatchID } = await playAgain(matchID, '1', seats['1']);
    await rejoin(nextMatchID, 'Bob', '1');
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(await seatsOf(nextMatchID)).toEqual({ 0: 'Bob' });
  });
});
