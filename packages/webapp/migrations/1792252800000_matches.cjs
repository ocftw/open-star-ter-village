exports.up = pgm => pgm.sql(`
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
create index matches_host_idx   on matches (host_user_id, created_at);
`);

exports.down = pgm => pgm.dropTable('matches');
