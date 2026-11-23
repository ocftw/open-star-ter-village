import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';
import { MIGRATIONS, MIGRATIONS_TABLE, MIGRATION_LOCK_KEY } from './migrations';

/** One `matches` row as the store reads and writes it. */
export interface MatchRow {
  match_id: string;
  game_name: string;
  game_version: string;
  host_user_id: string;
  state: unknown;
  initial_state: unknown;
  metadata: unknown;
  result: unknown;
  state_id: number;
  is_gameover: boolean;
}

export type MatchWrite = Omit<MatchRow, 'initial_state'> & { initial_state: unknown };

export interface ListFilter {
  gameName?: string;
  isGameover?: boolean;
  updatedBefore?: number;
  updatedAfter?: number;
  gameVersion: string;
  resumeWindowHours: number;
}

/** Opaque transaction handle; the Sequelize implementation passes its Transaction. */
export type Tx = unknown;

/**
 * The SQL the member store issues, one method per statement. The store owns
 * the rules (member-only, `_stateID` guard, latest-state slot); this layer
 * only talks to PostgreSQL, so unit tests can swap in a fake.
 */
export interface MatchesSql {
  migrate(): Promise<void>;
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  /** Row lock for the conditional write; returns the stored state_id or undefined. */
  lockStateId(tx: Tx, matchID: string): Promise<number | undefined>;
  insert(tx: Tx, row: MatchWrite): Promise<void>;
  update(tx: Tx, row: MatchWrite): Promise<void>;
  /** A restorable row: not abandoned and updated inside the resume window. */
  findRestorable(matchID: string, resumeWindowHours: number): Promise<MatchRow | undefined>;
  listRestorable(filter: ListFilter): Promise<string[]>;
  /** Rows inside the window whose game_version this build cannot resume. */
  listUnknownVersions(gameVersion: string, resumeWindowHours: number): Promise<string[]>;
  markAbandoned(matchID: string): Promise<void>;
  markStaleAbandoned(resumeWindowHours: number): Promise<number>;
  deleteRow(matchID: string): Promise<void>;
  close(): Promise<void>;
}

const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

export class SequelizeMatchesSql implements MatchesSql {
  constructor(private readonly sequelize: Sequelize) {}

  private query<T extends object>(sql: string, bind: unknown[], transaction?: Tx): Promise<T[]> {
    return this.sequelize.query<T>(sql, {
      bind,
      type: QueryTypes.SELECT,
      transaction: transaction as Transaction | undefined,
    });
  }

  private async run(sql: string, bind: unknown[], transaction?: Tx): Promise<number> {
    const [, meta] = await this.sequelize.query(sql, { bind, transaction: transaction as Transaction | undefined });
    return (meta as { rowCount?: number } | undefined)?.rowCount ?? 0;
  }

  async migrate(): Promise<void> {
    await this.sequelize.transaction(async (tx) => {
      await this.sequelize.query(`select pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`, { transaction: tx });
      await this.sequelize.query(
        `create table if not exists ${MIGRATIONS_TABLE} (id text primary key, applied_at timestamptz not null default now())`,
        { transaction: tx },
      );
      const applied = new Set(
        (await this.query<{ id: string }>(`select id from ${MIGRATIONS_TABLE}`, [], tx)).map((row) => row.id),
      );
      for (const migration of MIGRATIONS) {
        if (applied.has(migration.id)) continue;
        await this.sequelize.query(migration.sql, { transaction: tx });
        await this.run(`insert into ${MIGRATIONS_TABLE} (id) values ($1)`, [migration.id], tx);
      }
    });
  }

  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.sequelize.transaction((tx) => fn(tx));
  }

  async lockStateId(tx: Tx, matchID: string): Promise<number | undefined> {
    const rows = await this.query<{ state_id: number }>(
      'select state_id from matches where match_id = $1 for update',
      [matchID],
      tx,
    );
    return rows[0]?.state_id;
  }

  async insert(tx: Tx, row: MatchWrite): Promise<void> {
    await this.run(
      `insert into matches
        (match_id, game_name, game_version, host_user_id, state, initial_state, metadata, result, state_id, is_gameover)
        values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)`,
      [
        row.match_id, row.game_name, row.game_version, row.host_user_id, json(row.state),
        json(row.initial_state), json(row.metadata), json(row.result), row.state_id, row.is_gameover,
      ],
      tx,
    );
  }

  async update(tx: Tx, row: MatchWrite): Promise<void> {
    await this.run(
      `update matches set host_user_id = $2, state = $3::jsonb, metadata = $4::jsonb, result = $5::jsonb,
        state_id = $6, is_gameover = $7, abandoned_at = null, updated_at = now()
        where match_id = $1`,
      [row.match_id, row.host_user_id, json(row.state), json(row.metadata), json(row.result), row.state_id, row.is_gameover],
      tx,
    );
  }

  async findRestorable(matchID: string, resumeWindowHours: number): Promise<MatchRow | undefined> {
    const rows = await this.query<MatchRow>(
      `select match_id, game_name, game_version, host_user_id, state, initial_state, metadata, result, state_id, is_gameover
        from matches
        where match_id = $1 and abandoned_at is null and updated_at > now() - ($2 * interval '1 hour')`,
      [matchID, resumeWindowHours],
    );
    return rows[0];
  }

  async listRestorable(filter: ListFilter): Promise<string[]> {
    const rows = await this.query<{ match_id: string }>(
      `select match_id from matches
        where abandoned_at is null and updated_at > now() - ($1 * interval '1 hour') and game_version = $2
          and ($3::text is null or game_name = $3)
          and ($4::boolean is null or is_gameover = $4)
          and ($5::bigint is null or updated_at < to_timestamp($5 / 1000.0))
          and ($6::bigint is null or updated_at > to_timestamp($6 / 1000.0))`,
      [
        filter.resumeWindowHours, filter.gameVersion, filter.gameName ?? null, filter.isGameover ?? null,
        filter.updatedBefore ?? null, filter.updatedAfter ?? null,
      ],
    );
    return rows.map((row) => row.match_id);
  }

  async listUnknownVersions(gameVersion: string, resumeWindowHours: number): Promise<string[]> {
    const rows = await this.query<{ match_id: string }>(
      `select match_id from matches
        where abandoned_at is null and updated_at > now() - ($1 * interval '1 hour') and game_version <> $2`,
      [resumeWindowHours, gameVersion],
    );
    return rows.map((row) => row.match_id);
  }

  async markAbandoned(matchID: string): Promise<void> {
    await this.run('update matches set abandoned_at = now() where match_id = $1 and abandoned_at is null', [matchID]);
  }

  markStaleAbandoned(resumeWindowHours: number): Promise<number> {
    return this.run(
      `update matches set abandoned_at = now()
        where is_gameover = false and abandoned_at is null and updated_at <= now() - ($1 * interval '1 hour')`,
      [resumeWindowHours],
    );
  }

  async deleteRow(matchID: string): Promise<void> {
    await this.run('delete from matches where match_id = $1', [matchID]);
  }

  close(): Promise<void> {
    return this.sequelize.close();
  }
}
