import type { SocketIO } from 'boardgame.io/server';
import { readPersistenceConfig, type PersistenceConfig } from './config';
import { readHostTokenSecret } from './hostToken';
import { MemberPostgresStore, type MemberStoreOptions } from './memberStore';
import { PersistentSocketIO } from './persistentMaster';

export type PersistenceStatus = 'on' | 'off' | 'degraded';

export interface Persistence {
  config: PersistenceConfig;
  /** Verified-host secret bytes; undefined disables member hosting. */
  hostTokenSecret?: Uint8Array;
  /** Undefined when persistence is off: boardgame.io's default InMemory store is used. */
  store?: MemberPostgresStore;
  /** Undefined when persistence is off: the stock SocketIO transport is used. */
  transport?: SocketIO;
  status(): PersistenceStatus;
  endGameUnsaved(matchID: string): boolean;
  /** Finish in-flight and pending latest-state writes, then close. True when nothing is left unsaved. */
  close(): Promise<boolean>;
}

/**
 * Build the persistence pieces from env only. Throws a fixed-message config
 * error (bad MATCH_PERSISTENCE, MATCH_RESUME_WINDOW_HOURS, or a secret under
 * 32 bytes) so startup fails closed. With persistence off, no database
 * connection is opened.
 */
export function createPersistence(
  env: Record<string, string | undefined> = process.env,
  storeOverrides: Partial<MemberStoreOptions> = {},
): Persistence {
  const config = readPersistenceConfig(env);
  const hostTokenSecret = readHostTokenSecret(env.GAME_SERVER_AUTH_SECRET);
  if (config.mode === 'off') {
    return {
      config,
      hostTokenSecret,
      status: () => 'off',
      endGameUnsaved: () => false,
      close: async () => true,
    };
  }
  if (!hostTokenSecret) {
    console.warn('GAME_SERVER_AUTH_SECRET is unset; every match is guest-hosted and nothing is persisted');
  }
  const store = new MemberPostgresStore({
    databaseUrl: config.databaseUrl!,
    resumeWindowHours: config.resumeWindowHours,
    ...storeOverrides,
  });
  return {
    config,
    hostTokenSecret,
    store,
    transport: new PersistentSocketIO(),
    status: () => store.status(),
    endGameUnsaved: (matchID) => store.endGameUnsaved(matchID),
    close: () => store.flushAndClose(),
  };
}
