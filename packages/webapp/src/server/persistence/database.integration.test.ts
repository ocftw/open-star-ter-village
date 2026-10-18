import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Pool } from 'pg';

// DATABASE_URL must point to a disposable test database. CI provides PostgreSQL 16.
const integration = process.env.DATABASE_URL ? describe : describe.skip;
integration('PostgreSQL persistence schema and abandoned-match job', () => {
  const matchPrefix = `integration-${randomUUID()}`;
  let pool: Pool;

  function runNative(script: string) {
    // Run the same source under native Node 24's ESM support, outside Jest's
    // CommonJS loader. Production compilation is checked by build:server.
    const result = spawnSync(process.execPath, ['-r', 'ts-node/register/transpile-only', '-e', script], {
      cwd: path.resolve(__dirname, '../../..'),
      env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.server.json' },
      encoding: 'utf8', timeout: 20000,
    });
    expect(result.status).toBe(0);
    return result.stdout.trim();
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    expect(runNative(`
      const { Pool } = require('pg');
      const { migrate } = require('./src/server/persistence/database');
      (async () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const client = await pool.connect();
        try { await migrate(client); await migrate(client); console.log('migrations-ok'); }
        finally { client.release(); await pool.end(); }
      })().catch(() => { console.error('migration failed'); process.exitCode = 1; });
    `)).toBe('migrations-ok');
  }, 30000);

  afterAll(async () => {
    await pool.query('delete from matches where match_id like $1', [`${matchPrefix}%`]);
    await pool.end();
  });

  it('creates the exact index columns and HOT-update fillfactor', async () => {
    const { rows } = await pool.query(`select indexname, indexdef from pg_indexes
      where schemaname = current_schema() and tablename = 'matches' order by indexname`);
    expect(rows.map(row => row.indexname)).toEqual(['matches_active_idx', 'matches_host_idx', 'matches_pkey']);
    expect(rows.find(row => row.indexname === 'matches_active_idx').indexdef)
      .toMatch(/\(game_name\) WHERE \(is_gameover = false\)/);
    expect(rows.find(row => row.indexname === 'matches_host_idx').indexdef).toContain('(host_user_id, created_at)');
    expect(rows.every(row => !/\b(state|updated_at)\b/.test(row.indexdef))).toBe(true);
    const table = await pool.query(`select reloptions from pg_class where oid = 'matches'::regclass`);
    expect(table.rows[0].reloptions).toContain('fillfactor=70');
  });

  it('stores SQL NULL for unfinished matches and preserves explicit JSON game-over results', async () => {
    expect(runNative(`
      const { Pool } = require('pg');
      const { InitializeGame } = require('boardgame.io/internal');
      const { PersistentStore } = require('./src/server/persistence/PersistentStore');
      (async () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        try {
          const store = new PersistentStore(pool);
          for (const [suffix, gameover] of [['unfinished', undefined], ['null-result', null], ['winner', { winner: '0' }]]) {
            const state = InitializeGame({ game: { name: 'test', setup: () => ({}) }, numPlayers: 3 });
            if (gameover !== undefined) state.ctx.gameover = gameover;
            store.createMatch('${matchPrefix}-' + suffix, { initialState: state,
              metadata: { gameName: 'test', players: {}, createdAt: 0, updatedAt: 0, host_user_id: 'member' } });
          }
          await store.flush();
          console.log('saved');
        } finally { await pool.end(); }
      })().catch(() => { console.error('save failed'); process.exitCode = 1; });
    `)).toBe('saved');
    const { rows } = await pool.query(`select match_id, result is null as sql_null,
      jsonb_typeof(result) as json_type, result, is_gameover from matches
      where match_id = any($1) order by match_id`, [[
      `${matchPrefix}-unfinished`, `${matchPrefix}-null-result`, `${matchPrefix}-winner`,
    ]]);
    expect(rows.map(row => ({ suffix: row.match_id.slice(matchPrefix.length), sqlNull: row.sql_null,
      jsonType: row.json_type, result: row.result, finished: row.is_gameover }))).toEqual([
      { suffix: '-null-result', sqlNull: false, jsonType: 'null', result: null, finished: true },
      { suffix: '-unfinished', sqlNull: true, jsonType: null, result: null, finished: false },
      { suffix: '-winner', sqlNull: false, jsonType: 'object', result: { winner: '0' }, finished: true },
    ]);
  });

  it('marks idle rows without deleting them and honors a 48-hour window', async () => {
    const idlePrefix = `${matchPrefix}-idle`;
    for (const [suffix, hours, finished] of [['old', 49, false], ['between', 30, false], ['recent', 1, false], ['finished', 50, true]] as const) {
      await pool.query(`insert into matches
        (match_id,game_name,game_version,host_user_id,state,initial_state,metadata,state_id,is_gameover,updated_at)
        values ($1,'test','1','member','{}','{}','{}',0,$2,now()-($3*interval '1 hour'))`,
      [`${idlePrefix}-${suffix}`, finished, hours]);
    }
    const invoke = (hours: number) => runNative(`
      const { Pool } = require('pg');
      const { markAbandoned } = require('./src/server/persistence/database');
      (async () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        try { await markAbandoned(pool, ${hours}); console.log('marked'); }
        finally { await pool.end(); }
      })().catch(() => { console.error('mark failed'); process.exitCode = 1; });
    `);
    expect(invoke(48)).toBe('marked');
    const result = await pool.query('select match_id, abandoned_at from matches where match_id like $1', [`${idlePrefix}%`]);
    expect(result.rowCount).toBe(4);
    expect(result.rows.filter(row => row.abandoned_at !== null).map(row => row.match_id)).toEqual([`${idlePrefix}-old`]);
    expect(invoke(24)).toBe('marked');
    const between = await pool.query('select abandoned_at from matches where match_id=$1', [`${idlePrefix}-between`]);
    expect(between.rows[0].abandoned_at).not.toBeNull();
  });
});
