import { InMemory } from 'boardgame.io/server';
import { Pool } from 'pg';
import { persistenceConfig } from './config';
import { markAbandoned, migrate } from './database';
import { GAME_VERSION, PersistentStore, SavedMatch } from './PersistentStore';
import { reportPersistenceFailure } from './report';

export type PersistenceStatus = 'on' | 'off' | 'degraded';
export interface Persistence {
  store: InMemory;
  status: PersistenceStatus;
  close: () => Promise<void>;
}

export async function initializePersistence(env: Record<string, string | undefined> = process.env): Promise<Persistence> {
  const memoryOnly = (status: PersistenceStatus): Persistence => ({
    store: new InMemory(), status, close: async () => {},
  });
  if (env.MATCH_PERSISTENCE === 'off' || !env.DATABASE_URL) {
    if (!env.DATABASE_URL) console.warn('DATABASE_URL is unset; matches are memory-only');
    return memoryOnly('off');
  }
  const { resumeWindowHours: hours } = persistenceConfig(env);
  const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 3000,
    query_timeout: 5000, statement_timeout: 5000 });
  pool.on('error', () => reportPersistenceFailure('connection'));
  try {
    const client = await pool.connect();
    try { await migrate(client); } finally { client.release(); }
    const store = new PersistentStore(pool);
    const { rows } = await pool.query<SavedMatch>(`select * from matches
      where is_gameover = false and abandoned_at is null
        and updated_at > now() - ($1 * interval '1 hour')`, [hours]);
    for (const saved of rows) {
      if (saved.game_version !== GAME_VERSION) {
        reportPersistenceFailure('unknown-game-version', saved.match_id);
        continue;
      }
      store.restore(saved);
    }
    const daily = setInterval(() => {
      void markAbandoned(pool, hours).catch(() => reportPersistenceFailure('mark-abandoned'));
    }, 24 * 60 * 60 * 1000);
    daily.unref();
    return { store, status: 'on', close: async () => { clearInterval(daily); await pool.end(); } };
  } catch {
    reportPersistenceFailure('startup');
    await pool.end();
    return memoryOnly('degraded');
  }
}
