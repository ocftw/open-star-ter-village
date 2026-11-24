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
  {
    id: '0002_member_accounts',
    sql: `
create table users (
  id                text primary key default gen_random_uuid()::text,
  name              text check (name is null),
  email             text check (email is null),
  "emailVerified"   timestamptz,
  image             text check (image is null),
  contact_email     text,
  nickname          text,
  marketing_opt_in  boolean not null default false,
  consent_version   text,
  opt_in_at         timestamptz,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);
create table accounts (
  id                  bigint generated always as identity primary key,
  "userId"            text not null unique references users(id) on delete cascade,
  provider            text not null,
  type                text not null,
  "providerAccountId" text not null,
  access_token        text,
  expires_at          integer,
  refresh_token       text,
  id_token            text,
  scope               text,
  session_state       text,
  token_type          text,
  unique (provider, "providerAccountId")
);
create table sessions (
  id             bigint generated always as identity primary key,
  "userId"       text not null references users(id) on delete cascade,
  expires        timestamptz not null,
  "sessionToken" text not null unique
);
create index sessions_user_idx on sessions ("userId");
create table verification_token (
  identifier text not null,
  token      text not null,
  expires    timestamptz not null,
  primary key (identifier, token)
);
`,
  },
];

/** Run inside a transaction so concurrent web and game server starts share the same lock. */
export async function applyMigrations(
  query: (sql: string, bind?: string[]) => Promise<unknown>,
  readApplied: (sql: string) => Promise<{ id: string }[]>,
): Promise<void> {
  await query(`select pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`);
  await query(
    `create table if not exists ${MIGRATIONS_TABLE} (id text primary key, applied_at timestamptz not null default now())`,
  );
  const applied = new Set((await readApplied(`select id from ${MIGRATIONS_TABLE}`)).map(({ id }) => id));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await query(migration.sql);
    await query(`insert into ${MIGRATIONS_TABLE} (id) values ($1)`, [migration.id]);
  }
}
