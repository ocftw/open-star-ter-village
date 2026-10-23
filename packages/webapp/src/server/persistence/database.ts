import path from 'node:path';
import { runner } from 'node-pg-migrate';
import type { Pool, PoolClient } from 'pg';

export async function migrate(client: PoolClient): Promise<void> {
  await runner({
    dbClient: client,
    dir: path.resolve(__dirname, '../../../migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {},
    logger: { info: () => {}, warn: () => {}, error: () => {} },
  });
}

export async function markAbandoned(pool: Pick<Pool, 'query'>, hours: number): Promise<void> {
  await pool.query(`update matches set abandoned_at = now()
    where is_gameover = false and abandoned_at is null
      and updated_at <= now() - ($1 * interval '1 hour')`, [hours]);
}
