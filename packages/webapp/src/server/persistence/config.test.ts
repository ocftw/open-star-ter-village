import { randomBytes } from 'node:crypto';
import { PersistenceConfigError, readPersistenceConfig } from './config';
import { HostTokenConfigError } from './hostToken';
import { createPersistence } from './index';

const URL = 'postgres://user@127.0.0.1:1/db';

describe('readPersistenceConfig (DB-A5, DB-A3)', () => {
  it('is off when DATABASE_URL is unset, even if member is requested', () => {
    expect(readPersistenceConfig({})).toMatchObject({ mode: 'off', databaseUrl: undefined });
    expect(readPersistenceConfig({ MATCH_PERSISTENCE: 'member' })).toMatchObject({ mode: 'off' });
  });

  it('defaults to member when DATABASE_URL is set, and honours off', () => {
    expect(readPersistenceConfig({ DATABASE_URL: URL })).toMatchObject({ mode: 'member', databaseUrl: URL });
    expect(readPersistenceConfig({ DATABASE_URL: URL, MATCH_PERSISTENCE: 'off' })).toMatchObject({ mode: 'off', databaseUrl: undefined });
  });

  it('rejects any other mode, including all', () => {
    expect(() => readPersistenceConfig({ DATABASE_URL: URL, MATCH_PERSISTENCE: 'all' })).toThrow(PersistenceConfigError);
  });

  it('uses a 24h resume window by default and accepts 48h', () => {
    expect(readPersistenceConfig({}).resumeWindowHours).toBe(24);
    expect(readPersistenceConfig({ MATCH_RESUME_WINDOW_HOURS: '48' }).resumeWindowHours).toBe(48);
    expect(() => readPersistenceConfig({ MATCH_RESUME_WINDOW_HOURS: '0' })).toThrow(PersistenceConfigError);
    expect(() => readPersistenceConfig({ MATCH_RESUME_WINDOW_HOURS: 'soon' })).toThrow(PersistenceConfigError);
  });
});

describe('createPersistence', () => {
  it('opens no connection when off', () => {
    const persistence = createPersistence({ MATCH_PERSISTENCE: 'off', DATABASE_URL: URL });
    expect(persistence.store).toBeUndefined();
    expect(persistence.transport).toBeUndefined();
    expect(persistence.status()).toBe('off');
    expect(createPersistence({}).status()).toBe('off');
  });

  it('fails closed on a short GAME_SERVER_AUTH_SECRET, in either mode', () => {
    expect(() => createPersistence({ GAME_SERVER_AUTH_SECRET: 'x'.repeat(31) })).toThrow(HostTokenConfigError);
    expect(() => createPersistence({ DATABASE_URL: URL, GAME_SERVER_AUTH_SECRET: 'x'.repeat(31) })).toThrow(HostTokenConfigError);
    expect(createPersistence({ GAME_SERVER_AUTH_SECRET: randomBytes(32).toString('hex') }).hostTokenSecret).toBeDefined();
  });
});
