import { Client } from 'pg';
import { MIGRATION_LOCK_KEY } from '@/server/persistence/migrations';
import { memberDatabase } from './database';

const databaseUrl = process.env.TEST_DATABASE_URL;
const testDb = databaseUrl ? test : test.skip;

async function expectRejectionDuringLock(
  locker: Client,
  lock: string,
  operation: () => Promise<unknown>,
  expectedError: object,
) {
  await locker.query('begin');
  let pending: Promise<unknown> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await locker.query(lock);
    pending = operation();
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('The database wait did not time out')), 4_000);
    });
    await expect(Promise.race([pending, deadline])).rejects.toMatchObject(expectedError);
  } finally {
    clearTimeout(timer);
    await locker.query('rollback');
    await pending?.catch(() => undefined);
  }
}

testDb('bounds blocked member migrations and session reads, then recovers when locks clear', async () => {
  jest.replaceProperty(process, 'env', { ...process.env, DATABASE_URL: databaseUrl, MATCH_PERSISTENCE: 'member' });
  const locker = new Client({ connectionString: databaseUrl });
  await locker.connect();
  try {
    await expectRejectionDuringLock(locker, `select pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`,
      memberDatabase, { message: 'Member database migration failed' });

    const pool = await memberDatabase();
    const readSession = () => pool.query('select 1 from sessions where "sessionToken" = $1', ['missing-session']);
    await expectRejectionDuringLock(locker, 'lock table sessions in access exclusive mode',
      readSession, { code: '57014' });
    await expect(readSession()).resolves.toMatchObject({ rowCount: 0 });
  } finally {
    await locker.end();
    await (await memberDatabase()).end();
    jest.restoreAllMocks();
  }
}, 15_000);
