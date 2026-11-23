/**
 * Schema migrations, compiled into dist with the server so the runtime image
 * needs no extra files. Each runs once, in order, under an advisory lock;
 * running the set again is a no-op. Phase 2 (`match_leases`) is a later entry.
 */
export interface Migration {
  id: string;
  sql: string;
}

export const MIGRATIONS_TABLE = 'osv_schema_migrations';
/** Arbitrary constant key for pg_advisory_xact_lock; serializes migrators. */
export const MIGRATION_LOCK_KEY = 445_001;

export const MIGRATIONS: readonly Migration[] = [
  {
    id: '0001_matches',
    sql: `
create table matches (
  match_id      text primary key,
  game_name     text not null,
  game_version  text not null,
  host_user_id  text not null,
  state         jsonb not null,
  initial_state jsonb not null,
  metadata      jsonb not null,
  result        jsonb,
  state_id      integer not null,
  is_gameover   boolean not null default false,
  abandoned_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
) with (fillfactor = 70);
create index matches_active_idx on matches (game_name) where is_gameover = false;
create index matches_host_idx on matches (host_user_id, created_at);
`,
  },
];
