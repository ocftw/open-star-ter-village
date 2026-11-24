/**
 * Real-PostgreSQL integration tests. Skipped unless TEST_DATABASE_URL points
 * at a disposable server (a superuser on a local/CI throwaway cluster); each
 * run creates and drops its own database and login role.
 */
import { randomBytes } from 'node:crypto';
import type { Game, Server, State } from 'boardgame.io';
import { Client as BgioClient, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import * as Sentry from '@sentry/node';
import { PostgresStore } from 'bgio-postgres';
import { Client as PgClient } from 'pg';
import { GAME_VERSION } from '@/game/gameVersion';
import { startGameServer, type RunningGameServer } from '../gameServer';
import { hostIdentity } from './hostToken';
import { MemberPostgresStore, StaleStateError } from './memberStore';
import { issueTestHostToken } from './testHostToken';

jest.mock('@sentry/node', () => ({ captureException: jest.fn(), init: jest.fn(), flush: jest.fn() }));
jest.setTimeout(60_000);

const BASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = BASE_URL ? describe : describe.skip;

const suffix = randomBytes(4).toString('hex');
const DB_NAME = `osv_it_${suffix}`;
const APP_ROLE = `osv_app_${suffix}`;
const APP_PASSWORD = randomBytes(18).toString('base64url');
const SECRET = randomBytes(32).toString('base64url');
const SEAT_SENTINEL = 'seat-sentinel';

let adminUrl: string;
let appUrl: string;
let admin: PgClient;
const servers: RunningGameServer[] = [];
const clients: { stop(): void }[] = [];
let logs: string[] = [];

const counter: Game<{ n: number }> = {
  name: 'counter',
  minPlayers: 2,
  maxPlayers: 2,
  setup: () => ({ n: 0 }),
  moves: { bump: ({ G }) => { G.n += 1; } },
};

function withDatabase(url: string, database: string, user?: { name: string; password: string }) {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  if (user) {
    parsed.username = user.name;
    parsed.password = user.password;
  }
  return parsed.toString();
}

const q = async <T extends object = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await admin.query(sql, params)).rows as T[];

async function until(check: () => boolean | Promise<boolean>, timeoutMs = 8_000) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`timeout: ${check.toString()}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

const memberEnv = (extra: Record<string, string> = {}) => ({
  MATCH_PERSISTENCE: 'member',
  DATABASE_URL: appUrl,
  GAME_SERVER_AUTH_SECRET: SECRET,
  ...extra,
});

async function start(env: Record<string, string | undefined>) {
  const running = await startGameServer({
    games: [counter],
    port: 0,
    origins: [],
    env,
    storeOverrides: { endGameRetryDelaysMs: [10], backgroundRetryMs: 100, backgroundRetryMaxMs: 200 },
  });
  servers.push(running);
  const url = `http://localhost:${running.port}`;
  return { running, url, lobby: new LobbyClient({ server: url }) };
}

function connect(url: string, matchID: string, playerID: string, credentials: string) {
  const client = BgioClient({ game: counter, matchID, playerID, credentials, multiplayer: SocketIO({ server: url }) });
  client.start();
  clients.push(client);
  return client;
}

async function memberMatch(lobby: LobbyClient, sub = 'member-1') {
  const token = await issueTestHostToken(new TextEncoder().encode(SECRET), { sub });
  const { matchID } = await lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
  const a = await lobby.joinMatch('counter', matchID, { playerID: '0', playerName: 'Alice', data: { note: SEAT_SENTINEL } });
  const b = await lobby.joinMatch('counter', matchID, { playerID: '1', playerName: 'Bob' });
  return { matchID, credA: a.playerCredentials, credB: b.playerCredentials };
}

const health = async (url: string) => ((await (await fetch(`${url}/health`)).json()) as { persistence: string }).persistence;
const storeFor = (resumeWindowHours = 24, logging?: (sql: string) => void) =>
  new MemberPostgresStore({
    databaseUrl: appUrl,
    resumeWindowHours,
    endGameRetryDelaysMs: [10],
    sequelizeOptions: logging ? { logging } : {},
  });

describeDb('PostgreSQL persistence (real database)', () => {
  beforeAll(async () => {
    adminUrl = BASE_URL!;
    const root = new PgClient({ connectionString: adminUrl });
    await root.connect();
    await root.query(`create database ${DB_NAME}`);
    await root.query(`create role ${APP_ROLE} login password '${APP_PASSWORD}'`);
    await root.end();
    adminUrl = withDatabase(BASE_URL!, DB_NAME);
    appUrl = withDatabase(BASE_URL!, DB_NAME, { name: APP_ROLE, password: APP_PASSWORD });
    admin = new PgClient({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`grant all on schema public to ${APP_ROLE}`);
  });

  afterAll(async () => {
    await admin?.end();
    if (!BASE_URL) return;
    const root = new PgClient({ connectionString: BASE_URL });
    await root.connect();
    await root.query(`drop database if exists ${DB_NAME} with (force)`);
    await root.query(`drop role if exists ${APP_ROLE}`);
    await root.end();
  });

  beforeEach(() => {
    logs = [];
    jest.mocked(Sentry.captureException).mockClear();
    for (const level of ['warn', 'info', 'error', 'log'] as const) {
      jest.spyOn(console, level).mockImplementation((...args: unknown[]) => { logs.push(JSON.stringify(args)); });
    }
  });

  afterEach(async () => {
    clients.splice(0).forEach((client) => client.stop());
    await Promise.all(servers.splice(0).map((running) => running.stop(2_000)));
    await q(`grant select, insert, update, delete on all tables in schema public to ${APP_ROLE}`).catch(() => undefined);
    jest.restoreAllMocks();
  });

  function expectNoSecrets() {
    const everything = logs.join('\n') + JSON.stringify(jest.mocked(Sentry.captureException).mock.calls);
    expect(everything).not.toContain(SECRET);
    expect(everything).not.toContain(APP_PASSWORD);
    expect(everything).not.toContain(SEAT_SENTINEL);
  }

  it('migrates idempotently to the accepted schema, with no match_leases table (DB-A3, DB-C1)', async () => {
    const first = storeFor();
    await first.connect();
    await first.flushAndClose();
    const second = storeFor();
    await second.connect();
    await second.flushAndClose();
    expect(await q('select id from osv_schema_migrations order by id')).toEqual([
      { id: '0001_matches' }, { id: '0002_member_accounts' },
    ]);

    const columns = await q<{ column_name: string; data_type: string; is_nullable: string }>(
      `select column_name, data_type, is_nullable from information_schema.columns
        where table_name = 'matches' order by ordinal_position`);
    expect(columns.map((c) => [c.column_name, c.data_type, c.is_nullable])).toEqual([
      ['match_id', 'text', 'NO'],
      ['game_name', 'text', 'NO'],
      ['game_version', 'text', 'NO'],
      ['host_user_id', 'text', 'NO'],
      ['state', 'jsonb', 'NO'],
      ['initial_state', 'jsonb', 'NO'],
      ['metadata', 'jsonb', 'NO'],
      ['result', 'jsonb', 'YES'],
      ['state_id', 'integer', 'NO'],
      ['is_gameover', 'boolean', 'NO'],
      ['abandoned_at', 'timestamp with time zone', 'YES'],
      ['created_at', 'timestamp with time zone', 'NO'],
      ['updated_at', 'timestamp with time zone', 'NO'],
    ]);
    expect((await q<{ reloptions: string[] }>(`select reloptions from pg_class where relname = 'matches'`))[0].reloptions)
      .toEqual(['fillfactor=70']);
    const indexes = Object.fromEntries((await q<{ indexname: string; indexdef: string }>(
      `select indexname, indexdef from pg_indexes where tablename = 'matches'`)).map((i) => [i.indexname, i.indexdef]));
    expect(indexes.matches_active_idx).toMatch(/\(game_name\) WHERE \(is_gameover = false\)/);
    expect(indexes.matches_host_idx).toMatch(/\(host_user_id, created_at\)/);
    expect(await q(`select 1 from information_schema.tables where table_name = 'match_leases'`)).toEqual([]);
  });

  it('unwrapped bgio-postgres stores a guest match; the wrapper stores nothing anywhere (DB-C1)', async () => {
    const tableRows = async () => {
      const tables = await q<{ table_name: string }>(
        `select table_name from information_schema.tables where table_schema = 'public' and table_name <> 'osv_schema_migrations'`);
      let total = 0;
      for (const { table_name } of tables) total += Number((await q<{ n: string }>(`select count(*) as n from "${table_name}"`))[0].n);
      return total;
    };
    const wrapper = storeFor();
    await wrapper.connect();
    const before = await tableRows();
    await wrapper.createMatch('guest-wrapped', { initialState: initial(), metadata: metadata() });
    await wrapper.setState('guest-wrapped', { ...initial(), _stateID: 1 });
    expect(await tableRows()).toBe(before);
    await wrapper.flushAndClose();

    const unwrapped = new PostgresStore(adminUrl, { logging: false });
    await unwrapped.connect();
    await unwrapped.createMatch('guest-unwrapped', { initialState: initial(), metadata: metadata() });
    expect(await q(`select id from "Games" where id = 'guest-unwrapped'`)).toHaveLength(1);
    await unwrapped.sequelize.close();
    await q('drop table "Games"');
  });

  it('rejects stale writes, accepts skipped versions, and issues no lease or owner query (DB-C4)', async () => {
    const statements: string[] = [];
    const store = storeFor(24, (sql) => statements.push(sql));
    await store.connect();
    await hostIdentity.run({ userId: 'member-1' }, () => store.createMatch('c4', { initialState: initial(), metadata: metadata() }));
    await store.setState('c4', { ...initial(), _stateID: 1 });
    statements.length = 0;
    await store.setState('c4', { ...initial(), _stateID: 6 });
    expect((await q<{ state_id: number }>(`select state_id from matches where match_id = 'c4'`))[0].state_id).toBe(6);
    expect(statements.join('\n')).not.toMatch(/lease|owner/i);
    expect(statements.some((sql) => /for update/i.test(sql))).toBe(true);

    await q(`update matches set state_id = 20 where match_id = 'c4'`);
    await expect(store.setState('c4', { ...initial(), _stateID: 7 })).rejects.toBeInstanceOf(StaleStateError);
    expect((await q<{ state_id: number }>(`select state_id from matches where match_id = 'c4'`))[0].state_id).toBe(20);
    await store.flushAndClose();
  });

  it('restores a member match after a restart with the original credentials; guests have no row (DB-A2)', async () => {
    const first = await start(memberEnv());
    expect(await health(first.url)).toBe('on');
    const { matchID, credA, credB } = await memberMatch(first.lobby);
    const guest = await first.lobby.createMatch('counter', { numPlayers: 2 });
    const alice = connect(first.url, matchID, '0', credA);
    await until(() => Boolean(alice.getState()?.isConnected));
    alice.moves.bump();
    await until(async () => (await q<{ state_id: number }>(`select state_id from matches where match_id = $1`, [matchID]))[0]?.state_id === 1);
    expect(await q('select 1 from matches where match_id = $1', [guest.matchID])).toEqual([]);
    clients.splice(0).forEach((client) => client.stop());
    await servers.splice(0)[0].stop(2_000);

    const second = await start(memberEnv());
    const alice2 = connect(second.url, matchID, '0', credA);
    await until(() => alice2.getState()?.G.n === 1);
    alice2.moves.bump();
    alice2.events.endTurn!();
    const bob2 = connect(second.url, matchID, '1', credB);
    await until(() => bob2.getState()?.ctx.currentPlayer === '1');
    bob2.moves.bump();
    await until(async () => (await q<{ state: { G: { n: number } } }>(`select state from matches where match_id = $1`, [matchID]))[0].state.G.n === 3);
    await expect(second.lobby.getMatch('counter', guest.matchID)).rejects.toThrow();
    expectNoSecrets();
  });

  it('reports degraded on mid-run database loss, keeps playing, then writes the latest state (DB-A5, DB-C8)', async () => {
    const { url, lobby } = await start(memberEnv());
    const { matchID, credA, credB } = await memberMatch(lobby);
    const alice = connect(url, matchID, '0', credA);
    const bob = connect(url, matchID, '1', credB);
    await until(() => Boolean(alice.getState()?.isConnected && bob.getState()?.isConnected));
    await q(`revoke update on matches from ${APP_ROLE}`);
    for (const expected of [1, 2, 3]) {
      alice.moves.bump();
      // Bob sees the server broadcast: the move was published despite the failed write.
      await until(() => bob.getState()!.G.n === expected);
    }
    expect(await health(url)).toBe('degraded');
    expect((await q<{ state_id: number }>(`select state_id from matches where match_id = $1`, [matchID]))[0].state_id).toBe(0);

    await q(`grant update on matches to ${APP_ROLE}`);
    alice.moves.bump();
    await until(async () => (await q<{ state_id: number }>(`select state_id from matches where match_id = $1`, [matchID]))[0].state_id === 4);
    expect(await health(url)).toBe('on');
    expectNoSecrets();
  });

  it('starts degraded, without crashing, when the database is unreachable (DB-A5)', async () => {
    const { url } = await start(memberEnv({ DATABASE_URL: 'postgres://nobody:nothing@127.0.0.1:1/none' }));
    expect(await health(url)).toBe('degraded');
  });

  it('skips a row with an unknown game_version and reports it, without crashing startup (DB-A5)', async () => {
    const store = storeFor();
    await store.connect();
    await hostIdentity.run({ userId: 'member-1' }, () => store.createMatch('old-rules', { initialState: initial(), metadata: metadata() }));
    await store.flushAndClose();
    await q(`update matches set game_version = 'retired' where match_id = 'old-rules'`);
    const { url, lobby } = await start(memberEnv());
    expect(await health(url)).toBe('on');
    await expect(lobby.getMatch('counter', 'old-rules')).rejects.toThrow();
    const operations = jest.mocked(Sentry.captureException).mock.calls.map(([, hint]) => (hint as { tags: { operation: string } }).tags.operation);
    expect(operations).toContain('unknown-game-version');
    expect(GAME_VERSION).not.toBe('retired');
  });

  it.each([[24, 23, true], [24, 25, false], [48, 47, true]])(
    'resume window %ih restores a match idle %ih: %s (DB-A3)', async (windowHours, idleHours, restored) => {
      const id = `window-${windowHours}-${idleHours}`;
      const store = storeFor();
      await store.connect();
      await hostIdentity.run({ userId: 'member-1' }, () => store.createMatch(id, { initialState: initial(), metadata: metadata() }));
      await store.flushAndClose();
      await q(`update matches set updated_at = now() - ($2 * interval '1 hour') where match_id = $1`, [id, idleHours]);
      const restarted = storeFor(windowHours);
      await restarted.connect();
      expect(Boolean((await restarted.fetch(id, { state: true })).state)).toBe(restored);
      const [row] = await q<{ abandoned_at: Date | null }>('select abandoned_at from matches where match_id = $1', [id]);
      expect(row.abandoned_at === null).toBe(restored);
      await restarted.flushAndClose();
    });

  it('flags a failed end-game write and clears it when a later retry lands (DB-C9)', async () => {
    const { url, lobby } = await start(memberEnv());
    const { matchID, credA } = await memberMatch(lobby);
    const alice = connect(url, matchID, '0', credA);
    await until(() => Boolean(alice.getState()?.isConnected));
    const status = async () =>
      ((await (await fetch(`${url}/games/counter/${matchID}/persistence`)).json()) as { endGameUnsaved: boolean }).endGameUnsaved;
    await q(`revoke update on matches from ${APP_ROLE}`);
    alice.events.endGame!({ winners: ['0'] });
    await until(() => Boolean(alice.getState()!.ctx.gameover));
    expect(await status()).toBe(true);
    await q(`grant update on matches to ${APP_ROLE}`);
    await until(async () => !(await status()));
    const [row] = await q<{ is_gameover: boolean; result: unknown }>('select is_gameover, result from matches where match_id = $1', [matchID]);
    expect(row).toEqual({ is_gameover: true, result: { winners: ['0'] } });
    expectNoSecrets();
  });
});

function initial(): State {
  return {
    G: { n: 0 },
    ctx: { numPlayers: 2, turn: 1, currentPlayer: '0', playOrder: ['0', '1'], playOrderPos: 0, phase: null, activePlayers: null },
    plugins: {},
    _undo: [],
    _redo: [],
    _stateID: 0,
  } as unknown as State;
}

function metadata(): Server.MatchData {
  return {
    gameName: 'counter',
    players: { 0: { id: 0, name: 'Alice', credentials: `${SEAT_SENTINEL}-0` }, 1: { id: 1 } },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as unknown as Server.MatchData;
}
