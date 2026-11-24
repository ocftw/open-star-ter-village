import type { Server, State } from 'boardgame.io';
import * as Sentry from '@sentry/node';
import { GAME_VERSION } from '@/game/gameVersion';
import { FakeMatchesSql } from './fakeMatchesSql';
import { hostIdentity } from './hostToken';
import { MemberPostgresStore, StaleStateError } from './memberStore';

jest.mock('@sentry/node', () => ({ captureException: jest.fn() }));

const SEAT_SECRET = 'seat-credential-sentinel-7f3a';

export function makeState(stateID: number, gameover?: unknown): State {
  return {
    G: { round: stateID },
    ctx: { turn: stateID, currentPlayer: '0', numPlayers: 2, playOrder: ['0', '1'], playOrderPos: 0, phase: 'round', activePlayers: null, gameover } as State['ctx'],
    plugins: {},
    _undo: [],
    _redo: [],
    _stateID: stateID,
  } as unknown as State;
}

export function makeMetadata(): Server.MatchData {
  return {
    gameName: 'OpenStarTerVillage',
    players: {
      0: { id: 0, name: 'Alice', credentials: `${SEAT_SECRET}-0`, isConnected: true },
      1: { id: 1, name: 'Bob', credentials: `${SEAT_SECRET}-1`, isConnected: true },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function makeStore(sql = new FakeMatchesSql(), overrides: Partial<ConstructorParameters<typeof MemberPostgresStore>[0]> = {}) {
  const store = new MemberPostgresStore({
    databaseUrl: 'postgres://unused@127.0.0.1:1/unused',
    resumeWindowHours: 24,
    endGameRetryDelaysMs: [1],
    backgroundRetryMs: 5,
    backgroundRetryMaxMs: 20,
    reconnectMs: 5,
    sql,
    ...overrides,
  });
  return { store, sql };
}

const asMember = <T>(userId: string, fn: () => Promise<T>) => hostIdentity.run({ userId }, fn);
const create = (store: MemberPostgresStore, id: string) =>
  store.createMatch(id, { initialState: makeState(0), metadata: makeMetadata() });
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let logs: string[];
beforeEach(() => {
  logs = [];
  jest.mocked(Sentry.captureException).mockClear();
  for (const level of ['warn', 'info', 'log', 'error'] as const) {
    jest.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs.push(JSON.stringify(args));
    });
  }
});
afterEach(() => jest.restoreAllMocks());

function expectNoCredentialLeak() {
  const reported = JSON.stringify(jest.mocked(Sentry.captureException).mock.calls);
  expect(logs.join('\n')).not.toContain(SEAT_SECRET);
  expect(reported).not.toContain(SEAT_SECRET);
}

describe('MemberPostgresStore: member-only persistence (DB-C1, DB-A2)', () => {
  it('writes no row and issues no SQL for a guest-hosted match', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await create(store, 'guest');
    await store.setState('guest', makeState(1));
    await store.setMetadata('guest', makeMetadata());
    expect(sql.rows.size).toBe(0);
    expect(sql.statements).toEqual([]);
    expect(store.isMemberHosted('guest')).toBe(false);
    // The guest match still plays from memory.
    expect((await store.fetch('guest', { state: true })).state._stateID).toBe(1);
  });

  it('stores the full state of a member-hosted match in the matches row', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    const row = sql.rows.get('m1')!;
    expect(row).toMatchObject({ host_user_id: 'member-1', game_version: GAME_VERSION, state_id: 0, is_gameover: false });
    expect((row.metadata as Server.MatchData).players[0].credentials).toBe(`${SEAT_SECRET}-0`);
    expect(store.status()).toBe('on');
  });
});

describe('MemberPostgresStore: _stateID guard (DB-C4)', () => {
  it('rejects a state older than the stored one and never retries it', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    await store.setState('m1', makeState(2));
    // Another writer moved the row ahead (e.g. a late retry elsewhere).
    sql.rows.get('m1')!.state_id = 9;
    const before = sql.writes.length;
    await expect(store.setState('m1', makeState(3))).rejects.toBeInstanceOf(StaleStateError);
    expect(sql.writes.length).toBe(before);
    expect(sql.rows.get('m1')!.state_id).toBe(9);
  });

  it('accepts a latest-state write that skips versions', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    await store.setState('m1', makeState(1));
    await store.setState('m1', makeState(5));
    expect(sql.rows.get('m1')!.state_id).toBe(5);
  });

  it('issues only the row lock and the update in the write transaction (no lease or owner query)', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    sql.statements = [];
    await store.setState('m1', makeState(1));
    expect(sql.statements).toEqual(['begin', 'lockStateId', 'update', 'commit']);
  });

  it('folds a setState and its setMetadata into one write', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    const writes = sql.writes.length;
    const metadata = makeMetadata();
    metadata.gameover = { winners: ['0'] };
    await Promise.all([store.setState('m1', makeState(1)), store.setMetadata('m1', metadata)]);
    expect(sql.writes.length).toBe(writes + 1);
    expect(sql.rows.get('m1')!.state_id).toBe(1);
    expect((sql.rows.get('m1')!.metadata as Server.MatchData).gameover).toEqual({ winners: ['0'] });
  });
});

describe('MemberPostgresStore: mid-game write failure (DB-C8)', () => {
  it('keeps playing in memory and writes only the latest state on the next update', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    sql.failNext(3);
    for (const id of [1, 2, 3]) {
      await expect(store.setState('m1', makeState(id))).resolves.toBeUndefined();
      expect((await store.fetch('m1', { state: true })).state._stateID).toBe(id);
      expect(store.endGameUnsaved('m1')).toBe(false);
    }
    expect(store.status()).toBe('degraded');
    expect(sql.rows.get('m1')!.state_id).toBe(0);
    // Every failure is logged; Sentry hears about it once it repeats.
    expect(logs.filter((line) => line.includes('Match persistence operation failed'))).toHaveLength(3);
    expect(jest.mocked(Sentry.captureException)).toHaveBeenCalledTimes(1);
    const writesBefore = sql.writes.length;
    await store.setState('m1', makeState(4));
    expect(sql.rows.get('m1')!.state_id).toBe(4);
    // One write of the latest state, not one per skipped move.
    expect(sql.writes.slice(writesBefore).map((write) => write.state_id)).toEqual([4]);
    expect(store.status()).toBe('on');
    expectNoCredentialLeak();
  });
});

describe('MemberPostgresStore: end-game write failure (DB-C9)', () => {
  it('retries the end-game write, flags it unsaved, and clears the flag when a background retry lands', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    // End-game write and its one retry fail; the background retry succeeds.
    sql.failNext(2);
    await store.setState('m1', makeState(7, { winners: ['0'] }));
    expect(store.endGameUnsaved('m1')).toBe(true);
    expect(sql.rows.get('m1')!.is_gameover).toBe(false);
    await wait(40);
    expect(store.endGameUnsaved('m1')).toBe(false);
    expect(sql.rows.get('m1')).toMatchObject({ is_gameover: true, state_id: 7, result: { winners: ['0'] } });
    expectNoCredentialLeak();
  });

  it('does not flag an end-game write that succeeds on its retry', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    sql.failNext(1);
    await store.setState('m1', makeState(7, { winners: ['0'] }));
    expect(store.endGameUnsaved('m1')).toBe(false);
    expect(sql.rows.get('m1')!.is_gameover).toBe(true);
  });

  it('never flags a guest-hosted match', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    sql.failAll = true;
    await create(store, 'guest');
    await store.setState('guest', makeState(7, { winners: ['0'] }));
    expect(store.endGameUnsaved('guest')).toBe(false);
  });
});

describe('MemberPostgresStore: restart restore (DB-A2, DB-A3, DB-A5)', () => {
  it('restores a member match in a new process with the original seat credentials', async () => {
    const sql = new FakeMatchesSql();
    const first = makeStore(sql).store;
    await first.connect();
    await asMember('member-1', () => create(first, 'm1'));
    await first.setState('m1', makeState(3));

    const restarted = makeStore(sql).store;
    await restarted.connect();
    const { state, metadata } = await restarted.fetch('m1', { state: true, metadata: true });
    expect(state._stateID).toBe(3);
    expect(metadata.players[0].credentials).toBe(`${SEAT_SECRET}-0`);
    expect(metadata.players[1].credentials).toBe(`${SEAT_SECRET}-1`);
    expect(metadata.players[0].isConnected).toBe(false);
    expect(await restarted.listMatches({ gameName: 'OpenStarTerVillage' })).toEqual(['m1']);
  });

  it.each([
    [24, 23, true],
    [24, 25, false],
    [48, 47, true],
    [48, 49, false],
  ])('with a %ih resume window, a match idle %ih is restored: %s', async (windowHours, idleHours, restored) => {
    const sql = new FakeMatchesSql();
    const first = makeStore(sql).store;
    await first.connect();
    await asMember('member-1', () => create(first, 'm1'));
    sql.rows.get('m1')!.updatedAt = Date.now() - idleHours * 3_600_000;
    const restarted = makeStore(sql, { resumeWindowHours: windowHours }).store;
    await restarted.connect();
    expect(Boolean((await restarted.fetch('m1', { state: true })).state)).toBe(restored);
    // Unfinished matches past the window are marked abandoned, never deleted.
    expect(sql.rows.get('m1')!.abandoned).toBe(!restored);
    expect(sql.rows.has('m1')).toBe(true);
  });

  it('refuses a row with an unknown game_version and reports it, without crashing startup', async () => {
    const sql = new FakeMatchesSql();
    const first = makeStore(sql).store;
    await first.connect();
    await asMember('member-1', () => create(first, 'old'));
    sql.rows.get('old')!.game_version = 'retired-rules';
    const restarted = makeStore(sql).store;
    await expect(restarted.connect()).resolves.toBeUndefined();
    expect(await restarted.fetch('old', { state: true })).toEqual({});
    const operations = jest.mocked(Sentry.captureException).mock.calls.map(([, hint]) =>
      (hint as { tags: { operation: string } }).tags.operation);
    expect(operations).toContain('unknown-game-version');
    expectNoCredentialLeak();
  });
});

describe('MemberPostgresStore: health and lifecycle (DB-A5, DB-C6)', () => {
  it('distinguishes failed lookups from missing matches before and after connecting', async () => {
    const { store, sql } = makeStore();
    await expect(store.fetch('unknown', { metadata: true })).rejects.toMatchObject({ status: 503 });
    await store.connect();
    sql.failAll = true;
    await expect(store.fetch('unknown', { metadata: true })).rejects.toMatchObject({ status: 503 });
    sql.failAll = false;
    await expect(store.fetch('unknown', { metadata: true })).resolves.toEqual({});
    await store.flushAndClose();
  });

  it('starts degraded when the database is unreachable and recovers in the background', async () => {
    const sql = new FakeMatchesSql();
    sql.migrateFails = true;
    const { store } = makeStore(sql);
    await expect(store.connect()).resolves.toBeUndefined();
    expect(store.status()).toBe('degraded');
    sql.migrateFails = false;
    await wait(30);
    expect(store.status()).toBe('on');
    await store.flushAndClose();
  });

  it('flushes an in-flight write and the pending latest state before closing', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    sql.failNext(1);
    await store.setState('m1', makeState(1)); // leaves a pending latest state
    sql.writeDelayMs = 20;
    const inFlight = store.setState('m1', makeState(2));
    void store.setState('m1', makeState(3)); // queued behind the in-flight write
    await expect(store.flushAndClose()).resolves.toBe(true);
    await inFlight;
    expect(sql.rows.get('m1')!.state_id).toBe(3);
    expect(sql.closed).toBe(true);
  });

  it('reports unsaved matches when the database is still down at shutdown', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    sql.failAll = true;
    await store.setState('m1', makeState(1));
    await expect(store.flushAndClose()).resolves.toBe(false);
  });
});

describe('MemberPostgresStore: host changes and wipe (DB-P4, DB-A3)', () => {
  it('drops the row when a guest takes over and writes one when a member does', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    await store.setHost('m1', undefined);
    expect(sql.rows.has('m1')).toBe(false);
    await store.setState('m1', makeState(1));
    expect(sql.rows.has('m1')).toBe(false);
    await store.setHost('m1', 'member-2');
    expect(sql.rows.get('m1')).toMatchObject({ host_user_id: 'member-2', state_id: 1 });
  });

  it('marks a wiped member match abandoned and keeps the row', async () => {
    const { store, sql } = makeStore();
    await store.connect();
    await asMember('member-1', () => create(store, 'm1'));
    await store.wipe('m1');
    expect(sql.rows.get('m1')!.abandoned).toBe(true);
    expect(await store.fetch('m1', { metadata: true })).toEqual({});
  });
});
