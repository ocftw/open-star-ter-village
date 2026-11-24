import { Pool } from 'pg';
import { readPersistenceConfig } from '@/server/persistence/config';
import { applyMigrations } from '@/server/persistence/migrations';

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

export function memberFeaturesEnabled(): boolean {
  return readPersistenceConfig(process.env).mode === 'member';
}

async function migrate(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await applyMigrations(
      (sql, bind) => client.query(sql, bind),
      async (sql) => (await client.query<{ id: string }>(sql)).rows,
    );
    await client.query('commit');
    client.release();
  } catch (error) {
    // Closing the failed connection rolls back its transaction and releases the lock.
    client.release(true);
    throw error;
  }
}

export async function memberDatabase(): Promise<Pool> {
  const { databaseUrl } = readPersistenceConfig(process.env);
  if (!databaseUrl) throw new Error('Member features are unavailable');
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 2_000,
      statement_timeout: 2_000,
      query_timeout: 2_500,
    });
    pool.on('error', () => console.warn('Member database connection lost'));
  }
  schemaReady ??= migrate(pool).catch(() => {
    schemaReady = undefined;
    throw new Error('Member database migration failed');
  });
  await schemaReady;
  return pool;
}
