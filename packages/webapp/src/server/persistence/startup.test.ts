import { Pool } from 'pg';
import { InMemory } from 'boardgame.io/server';
import { InitializeGame } from 'boardgame.io/internal';
import { initializePersistence } from './index';
import { migrate, markAbandoned } from './database';
import { reportPersistenceFailure } from './report';

jest.mock('pg', () => ({ Pool: jest.fn() }));
jest.mock('./database', () => ({ migrate: jest.fn(), markAbandoned: jest.fn().mockResolvedValue(undefined) }));
jest.mock('./report', () => ({ reportPersistenceFailure: jest.fn() }));
const env = { DATABASE_URL: 'secret-db-url' };
let pool: { connect: jest.Mock; query: jest.Mock; on: jest.Mock; end: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  pool = { connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
    query: jest.fn().mockResolvedValue({ rows: [] }), on: jest.fn(), end: jest.fn().mockResolvedValue(undefined) };
  jest.mocked(Pool).mockImplementation(() => pool as unknown as Pool);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

it.each([{}, { MATCH_PERSISTENCE: 'member' }, { ...env, MATCH_PERSISTENCE: 'off' }])
('opens no connection when persistence is off or no URL exists: %j', async config => {
  const result = await initializePersistence(config);
  expect(result.status).toBe('off');
  expect(result.store.constructor).toBe(InMemory);
  expect(Pool).not.toHaveBeenCalled();
});

it.each([{ MATCH_PERSISTENCE: 'off', DATABASE_URL: 'must-not-connect' }, {}])
('ignores an invalid resume window when database usage is disabled: %j', async config => {
  const result = await initializePersistence({ ...config, MATCH_RESUME_WINDOW_HOURS: 'invalid' });
  expect(result.status).toBe('off');
  expect(Pool).not.toHaveBeenCalled();
});

it('falls back to plain memory and reports one sanitized startup error', async () => {
  pool.connect.mockRejectedValue(new Error('secret connection details'));
  const result = await initializePersistence(env);
  expect(result.status).toBe('degraded');
  expect(result.store.constructor).toBe(InMemory);
  expect(reportPersistenceFailure).toHaveBeenCalledTimes(1);
  expect(reportPersistenceFailure).toHaveBeenCalledWith('startup');
  expect(pool.end).toHaveBeenCalledTimes(1);
});

it('runs migrations before loading, skips unknown versions, and hydrates known states without saves', async () => {
  const state = InitializeGame({ game: { name: 'test', setup: () => ({}) }, numPlayers: 3 });
  const known = { match_id: 'known', game_name: 'test', game_version: '1', host_user_id: 'member',
    state, initial_state: state, metadata: { gameName: 'test', players: {}, createdAt: 0, updatedAt: 0 } };
  pool.query.mockResolvedValueOnce({ rows: [known, { ...known, match_id: 'unknown', game_version: 'future' }] });
  const result = await initializePersistence({ ...env, MATCH_RESUME_WINDOW_HOURS: '48' });
  expect(result.status).toBe('on');
  expect(jest.mocked(migrate).mock.invocationCallOrder[0]).toBeLessThan(pool.query.mock.invocationCallOrder[0]);
  expect(pool.query.mock.calls[0][0]).toContain('is_gameover = false and abandoned_at is null');
  expect(pool.query.mock.calls[0][1]).toEqual([48]);
  expect(result.store.fetch('known', { state: true }).state).toBe(state);
  expect(result.store.fetch('unknown', { state: true }).state).toBeUndefined();
  expect(reportPersistenceFailure).toHaveBeenCalledWith('unknown-game-version', 'unknown');
  expect(pool.query).toHaveBeenCalledTimes(1);
  await result.close();
});

it('runs abandoned-match marking daily with the same window and cancels the job on close', async () => {
  jest.useFakeTimers();
  const result = await initializePersistence({ ...env, MATCH_RESUME_WINDOW_HOURS: '48' });
  await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
  expect(markAbandoned).toHaveBeenCalledWith(pool, 48);
  await result.close();
  await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
  expect(markAbandoned).toHaveBeenCalledTimes(1);
});
