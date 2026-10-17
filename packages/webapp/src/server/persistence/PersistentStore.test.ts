import { InMemory } from 'boardgame.io/server';
import { InitializeGame, ProcessGameConfig } from 'boardgame.io/internal';
import { Master } from 'boardgame.io/master';
import type { Pool } from 'pg';
import { PersistentStore, MemberMetadata } from './PersistentStore';
import { hostIdentity } from './hostIdentity';
import { reportPersistenceFailure } from './report';

jest.mock('./report', () => ({ reportPersistenceFailure: jest.fn() }));
const initialState = () => InitializeGame({ game: { name: 'test', setup: () => ({ count: 0 }) }, numPlayers: 3 });
const metadata = (member = true): MemberMetadata => ({
  gameName: 'test', players: { '0': { id: 0, credentials: 'seat-secret' } },
  createdAt: Date.now(), updatedAt: Date.now(), ...(member ? { host_user_id: 'member' } : {}),
});
const turn = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const query = jest.fn().mockResolvedValue({});
  const store = new PersistentStore({ query } as unknown as Pick<Pool, 'query'>);
  return { store, query };
}

afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

it('extends the actual synchronous InMemory, with no promises on the move path', async () => {
  const { store } = setup();
  expect(store).toBeInstanceOf(InMemory);
  expect(store.type()).toBe(new InMemory().type());
  expect(store.createMatch('guest', { initialState: initialState(), metadata: metadata(false) })).toBeUndefined();
  expect(store.setState('guest', initialState())).toBeUndefined();
  expect(store.fetch('guest', { state: true })).not.toBeInstanceOf(Promise);
});

it('never queues database operations for guest create, metadata, state, or wipe', async () => {
  const { store, query } = setup();
  store.createMatch('guest', { initialState: initialState(), metadata: metadata(false) });
  store.setState('guest', initialState());
  store.setMetadata('guest', metadata(false));
  store.wipe('guest');
  await store.flush();
  expect(store.pendingMatchIDs()).toEqual([]);
  expect(query).not.toHaveBeenCalled();
});

it('coalesces a synchronous burst into one upsert of the newest state', async () => {
  const { store, query } = setup();
  const state = initialState();
  store.createMatch('member', { initialState: state, metadata: metadata() });
  for (let id = 1; id <= 100; id++) store.setState('member', { ...state, _stateID: id });
  expect(query).not.toHaveBeenCalled();
  await store.flush();
  expect(query).toHaveBeenCalledTimes(1);
  expect(JSON.parse(query.mock.calls[0][1][4])._stateID).toBe(100);
  expect(query.mock.calls[0][0]).toContain('on conflict (match_id)');
});

it('allows one save in flight per match while saving different matches independently', async () => {
  const { store, query } = setup();
  let releaseA!: () => void;
  let releaseB!: () => void;
  query.mockImplementationOnce(() => new Promise<void>(resolve => { releaseA = resolve; }))
    .mockImplementationOnce(() => new Promise<void>(resolve => { releaseB = resolve; }));
  const state = initialState();
  store.createMatch('a', { initialState: state, metadata: metadata() });
  store.createMatch('b', { initialState: state, metadata: metadata() });
  await turn();
  expect(query).toHaveBeenCalledTimes(2);
  for (let id = 1; id < 5; id++) store.setState('a', { ...state, _stateID: id });
  await turn();
  expect(query).toHaveBeenCalledTimes(2);
  let drained = false;
  const flush = store.flush().then(() => { drained = true; });
  releaseA();
  await turn();
  expect(query).toHaveBeenCalledTimes(3);
  expect(JSON.parse(query.mock.calls[2][1][4])._stateID).toBe(4);
  expect(drained).toBe(false);
  releaseB();
  await flush;
  expect(drained).toBe(true);
});

it('retries failed saves with backoff and replaces the failed state with the newest pending one', async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate'] });
  const { store, query } = setup();
  query.mockRejectedValueOnce(new Error('secret SQL parameters and token'));
  const state = initialState();
  store.createMatch('retry', { initialState: state, metadata: metadata() });
  await turn();
  expect(reportPersistenceFailure).toHaveBeenCalledWith('save', 'retry');
  store.setState('retry', { ...state, _stateID: 9 });
  await jest.advanceTimersByTimeAsync(249);
  expect(query).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  await store.flush();
  expect(query).toHaveBeenCalledTimes(2);
  expect(JSON.parse(query.mock.calls[1][1][4])._stateID).toBe(9);
});

it('uses request-scoped identity and preserves it when updating metadata', async () => {
  const { store, query } = setup();
  hostIdentity.run('verified-member', () => {
    store.createMatch('member', { initialState: initialState(), metadata: metadata(false) });
  });
  store.setMetadata('member', { ...metadata(false), host_user_id: 'replacement' });
  await store.flush();
  expect(query.mock.calls[0][1][3]).toBe('verified-member');
});

it('loads without writes, saves game-over results, and retains a removed match as abandoned', async () => {
  const { store, query } = setup();
  const state = initialState();
  store.restore({ match_id: 'restored', game_name: 'test', game_version: '1',
    host_user_id: 'member', state, initial_state: state, metadata: metadata(), abandoned_at: null });
  await store.flush();
  expect(query).not.toHaveBeenCalled();
  store.setState('restored', { ...state, _stateID: 1, ctx: { ...state.ctx, gameover: { winner: '0' } } });
  await store.flush();
  expect(JSON.parse(query.mock.calls[0][1][7])).toEqual({ winner: '0' });
  expect(query.mock.calls[0][1][9]).toBe(true);
  store.wipe('restored');
  await store.flush();
  expect(store.fetch('restored', { state: true }).state).toBeUndefined();
  expect(query.mock.calls[1][1][10]).toBeInstanceOf(Date);
  expect(query.mock.calls[1][0]).not.toMatch(/delete from/i);
});

it('keeps the unlocked Master read/apply/save step synchronous for simultaneous moves', async () => {
  const { simultaneousGame } = require('./integration.fixture.cjs');
  const game = ProcessGameConfig(simultaneousGame);
  const state = InitializeGame({ game, numPlayers: 3 });
  const { store, query } = setup();
  store.createMatch('direct-master', { initialState: state, metadata: { ...metadata(), gameName: game.name! } });
  const master = new Master(game, store, { send: () => {}, sendAll: () => {} });
  await Promise.all(['0', '1'].map(playerID => master.onUpdate({
    type: 'MAKE_MOVE', payload: { type: 'act', args: [], playerID, credentials: 'test-seat-credential' },
  }, 0, 'direct-master', playerID)));
  const current = store.fetch('direct-master', { state: true }).state;
  expect(current._stateID).toBe(2);
  expect(current.G.applied.slice().sort()).toEqual(['0', '1']);
  await store.flush();
  expect(JSON.parse(query.mock.calls[query.mock.calls.length - 1][1][4])._stateID).toBe(2);
});
