import { PostgresStore } from 'bgio-postgres';
import type { LogEntry, Server, State, StorageAPI } from 'boardgame.io';
import pg from 'pg';
import type { Options } from 'sequelize';
import { GAME_VERSION } from '@/game/gameVersion';
import { currentHostUserId } from './hostToken';
import { type MatchesSql, type MatchWrite, SequelizeMatchesSql, type Tx } from './matchesSql';
import { reportPersistenceFailure } from './report';

/** A conditional write found a newer `state_id` in PostgreSQL. Never retried. */
export class StaleStateError extends Error {
  name = 'StaleStateError';
  constructor(readonly matchID: string) {
    super('Stale match state rejected');
  }
}

export class MatchUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super('Match storage temporarily unavailable');
  }
}

export type MemberStoreStatus = 'on' | 'degraded';

export interface MemberStoreOptions {
  databaseUrl: string;
  resumeWindowHours: number;
  /** Delays between end-game write attempts; one entry per retry. */
  endGameRetryDelaysMs?: number[];
  /** First background retry delay for an unsaved end-game state (doubles to a cap). */
  backgroundRetryMs?: number;
  backgroundRetryMaxMs?: number;
  /** Retry interval when the database is unreachable at startup. */
  reconnectMs?: number;
  /** How often stale unfinished matches are marked abandoned. */
  abandonSweepMs?: number;
  sequelizeOptions?: Options;
  /** Test seam: replace the SQL layer. */
  sql?: MatchesSql;
}

interface Entry {
  /** Verified member host; undefined means guest-hosted (memory only, no row). */
  hostUserId?: string;
  state: State;
  initialState: State;
  metadata: Server.MatchData;
  log: LogEntry[];
  /** Memory is ahead of PostgreSQL: the latest-state slot still needs writing. */
  dirty: boolean;
  writing?: Promise<void>;
  endGameUnsaved: boolean;
  retryTimer?: ReturnType<typeof setTimeout>;
  retryDelayMs?: number;
  /** Consecutive failed writes; mid-game failures reach Sentry once repeated. */
  failures: number;
}

/** A mid-game write failure is reported to Sentry when it repeats (2nd, then every 20th). */
const reportToSentry = (failures: number) => failures === 2 || (failures > 2 && failures % 20 === 0);

const isGameover = (state: State) => state.ctx.gameover !== undefined;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Phase 1 match store: a wrapper around bgio-postgres (`StorageAPI.Async`).
 *
 * It keeps bgio-postgres's Sequelize connection and its write shape (a
 * transaction that row-locks the match and only moves `_stateID` forward) but
 * stores rows in the accepted `matches` schema and adds two rules:
 *
 * - member-only: a match created by a guest host writes no row anywhere;
 * - `_stateID` guard: a write whose state is older than the stored one throws
 *   {@link StaleStateError}; a write that skips versions is accepted.
 *
 * The working copy of each active match stays in this process so a transient
 * database failure never stops play: the move is kept, the match is marked
 * dirty, and the next update writes the latest state (one slot per match, not
 * a queue). A failed end-game write is retried, then retried in the
 * background until it lands; {@link endGameUnsaved} exposes that state.
 * There is no lease or ownership check (Phase 2 adds one in
 * {@link assertWritable}, inside the same transaction).
 */
export class MemberPostgresStore extends PostgresStore {
  private readonly sql: MatchesSql;
  private readonly entries = new Map<string, Entry>();
  private readonly restoring = new Map<string, Promise<Entry | undefined>>();
  private readonly opts: Required<Omit<MemberStoreOptions, 'sql' | 'sequelizeOptions' | 'databaseUrl'>>;
  private ready = false;
  private lastOperationFailed = false;
  private closed = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private sweep?: ReturnType<typeof setInterval>;

  constructor(options: MemberStoreOptions) {
    super(options.databaseUrl, {
      dialect: 'postgres',
      dialectModule: pg,
      logging: false,
      pool: { max: 5, min: 0, idle: 10_000, acquire: 5_000 },
      dialectOptions: { connectionTimeoutMillis: 3_000, statement_timeout: 5_000, query_timeout: 5_000 },
      ...options.sequelizeOptions,
    });
    this.sql = options.sql ?? new SequelizeMatchesSql(this.sequelize);
    this.opts = {
      resumeWindowHours: options.resumeWindowHours,
      endGameRetryDelaysMs: options.endGameRetryDelaysMs ?? [250, 1_000],
      backgroundRetryMs: options.backgroundRetryMs ?? 5_000,
      backgroundRetryMaxMs: options.backgroundRetryMaxMs ?? 60_000,
      reconnectMs: options.reconnectMs ?? 10_000,
      abandonSweepMs: options.abandonSweepMs ?? 60 * 60 * 1_000,
    };
  }

  // ---- lifecycle ---------------------------------------------------------

  /**
   * Run migrations and report rows this build cannot resume. Never throws: an
   * unreachable database leaves the store `degraded` and retries in the
   * background while matches play from memory.
   */
  async connect(): Promise<void> {
    try {
      await this.sql.migrate();
      this.ready = true;
      this.lastOperationFailed = false;
    } catch (error) {
      this.lastOperationFailed = true;
      reportPersistenceFailure('connect', { error });
      this.schedule(() => void this.connect(), this.opts.reconnectMs);
      return;
    }
    try {
      for (const matchID of await this.sql.listUnknownVersions(GAME_VERSION, this.opts.resumeWindowHours)) {
        reportPersistenceFailure('unknown-game-version', { matchID, level: 'warning' });
      }
    } catch (error) {
      reportPersistenceFailure('restore', { error });
    }
    await this.sweepAbandoned();
    if (!this.sweep && !this.closed) {
      this.sweep = setInterval(() => void this.sweepAbandoned(), this.opts.abandonSweepMs);
      this.sweep.unref?.();
    }
  }

  status(): MemberStoreStatus {
    if (!this.ready || this.lastOperationFailed) return 'degraded';
    for (const entry of Array.from(this.entries.values())) {
      if (entry.hostUserId && entry.dirty) return 'degraded';
    }
    return 'on';
  }

  /** True while a member match's final state is not yet in PostgreSQL. */
  endGameUnsaved(matchID: string): boolean {
    return this.entries.get(matchID)?.endGameUnsaved ?? false;
  }

  isMemberHosted(matchID: string): boolean {
    return Boolean(this.entries.get(matchID)?.hostUserId);
  }

  hostUserId(matchID: string): string | undefined {
    return this.entries.get(matchID)?.hostUserId;
  }

  /** Member matches whose latest state is not yet persisted. */
  unsavedMatchIDs(): string[] {
    return Array.from(this.entries).filter(([, e]) => e.hostUserId && (e.dirty || e.writing)).map(([id]) => id);
  }

  /**
   * Shutdown: stop background timers, finish in-flight writes and write every
   * pending latest state once, then close the pool. Resolves false if any
   * member match is still unsaved.
   */
  async flushAndClose(): Promise<boolean> {
    this.closed = true;
    for (const timer of Array.from(this.timers)) clearTimeout(timer);
    this.timers.clear();
    if (this.sweep) clearInterval(this.sweep);
    for (const entry of Array.from(this.entries.values())) {
      if (entry.retryTimer) clearTimeout(entry.retryTimer);
      entry.retryTimer = undefined;
    }
    const pending = Array.from(this.entries).filter(([, e]) => e.hostUserId && (e.dirty || e.writing));
    await Promise.all(pending.map(([id]) => this.persist(id, { endGameRetries: false }).catch(() => undefined)));
    const clean = this.unsavedMatchIDs().length === 0;
    await this.sql.close().catch(() => undefined);
    return clean;
  }

  // ---- StorageAPI.Async --------------------------------------------------

  async createMatch(matchID: string, { initialState, metadata }: StorageAPI.CreateMatchOpts): Promise<void> {
    const hostUserId = currentHostUserId();
    this.entries.set(matchID, {
      hostUserId,
      state: initialState,
      initialState,
      metadata,
      log: [],
      dirty: false,
      endGameUnsaved: false,
      failures: 0,
    });
    // Guest-hosted (DB-C1): nothing is written, in any table.
    if (hostUserId) await this.persist(matchID);
  }

  async setState(matchID: string, state: State, deltalog?: LogEntry[]): Promise<void> {
    const entry = this.entries.get(matchID) ?? (await this.restore(matchID));
    if (!entry) return;
    if (state._stateID < entry.state._stateID) throw new StaleStateError(matchID);
    entry.state = state;
    if (deltalog?.length) entry.log = [...entry.log, ...deltalog];
    await this.persist(matchID);
  }

  async setMetadata(matchID: string, metadata: Server.MatchData): Promise<void> {
    const entry = this.entries.get(matchID) ?? (await this.restore(matchID));
    if (!entry) return;
    entry.metadata = metadata;
    await this.persist(matchID);
  }

  async fetch<O extends StorageAPI.FetchOpts>(matchID: string, opts: O): Promise<StorageAPI.FetchResult<O>> {
    const entry = this.entries.get(matchID) ?? (await this.restore(matchID));
    const result = {} as Record<string, unknown>;
    if (!entry) return result as StorageAPI.FetchResult<O>;
    if (opts.state) result.state = entry.state;
    if (opts.metadata) result.metadata = entry.metadata;
    if (opts.log) result.log = entry.log;
    if (opts.initialState) result.initialState = entry.initialState;
    return result as StorageAPI.FetchResult<O>;
  }

  /** Every player left: drop the match from memory; a member row is kept but marked abandoned. */
  async wipe(matchID: string): Promise<void> {
    const entry = this.entries.get(matchID);
    this.entries.delete(matchID);
    if (entry?.retryTimer) clearTimeout(entry.retryTimer);
    if (entry && !entry.hostUserId) return;
    if (!this.ready) return;
    try {
      await entry?.writing?.catch(() => undefined);
      await this.sql.markAbandoned(matchID);
    } catch (error) {
      this.failed('abandon', matchID, error);
    }
  }

  async listMatches(opts?: StorageAPI.ListMatchesOpts): Promise<string[]> {
    const where = opts?.where ?? {};
    const ids = new Set<string>();
    for (const [id, { metadata }] of Array.from(this.entries)) {
      if (opts?.gameName && metadata.gameName !== opts.gameName) continue;
      const over = metadata.gameover !== undefined && metadata.gameover !== null;
      if (where.isGameover === true && !over) continue;
      if (where.isGameover === false && over) continue;
      if (where.updatedBefore !== undefined && !(metadata.updatedAt < where.updatedBefore)) continue;
      if (where.updatedAfter !== undefined && !(metadata.updatedAt > where.updatedAfter)) continue;
      ids.add(id);
    }
    if (this.ready) {
      try {
        const restorable = await this.sql.listRestorable({
          gameName: opts?.gameName,
          isGameover: where.isGameover,
          updatedBefore: where.updatedBefore,
          updatedAfter: where.updatedAfter,
          gameVersion: GAME_VERSION,
          resumeWindowHours: this.opts.resumeWindowHours,
        });
        restorable.forEach((id) => ids.add(id));
      } catch (error) {
        this.failed('list', undefined, error);
      }
    }
    return Array.from(ids);
  }

  // ---- host succession (rematch, DB-P4) -----------------------------------

  /**
   * Point a match at a new host. A member host keeps or gains a row; a guest
   * host loses it, so the member-only rule follows whoever hosts the match.
   */
  async setHost(matchID: string, hostUserId: string | undefined): Promise<void> {
    const entry = this.entries.get(matchID) ?? (await this.restore(matchID));
    if (!entry || entry.hostUserId === hostUserId) return;
    const wasMember = Boolean(entry.hostUserId);
    entry.hostUserId = hostUserId;
    if (hostUserId) {
      await this.persist(matchID);
      return;
    }
    entry.dirty = false;
    entry.endGameUnsaved = false;
    if (!wasMember || !this.ready) return;
    try {
      await entry.writing?.catch(() => undefined);
      await this.sql.deleteRow(matchID);
    } catch (error) {
      this.failed('set-host', matchID, error);
    }
  }

  // ---- writes ------------------------------------------------------------

  /**
   * Write the latest in-memory state of a member match. Concurrent callers
   * share one in-flight write; anything that arrives meanwhile is folded into
   * the next write (latest wins). Transient failures resolve normally and
   * leave the match dirty; only a stale-state rejection rejects.
   */
  private persist(matchID: string, { endGameRetries = true } = {}): Promise<void> {
    const entry = this.entries.get(matchID);
    if (!entry?.hostUserId) return Promise.resolve();
    entry.dirty = true;
    if (!entry.writing) {
      entry.writing = this.drain(matchID, entry, endGameRetries).finally(() => {
        entry.writing = undefined;
      });
    }
    return entry.writing;
  }

  private async drain(matchID: string, entry: Entry, endGameRetries: boolean): Promise<void> {
    // Let a setState and the setMetadata issued with it land in one write.
    await Promise.resolve();
    while (entry.dirty && entry.hostUserId) {
      entry.dirty = false;
      const row = this.toRow(matchID, entry);
      const finalState = row.is_gameover;
      try {
        await this.writeWithRetry(row, finalState && endGameRetries ? this.opts.endGameRetryDelaysMs : []);
        this.lastOperationFailed = false;
        entry.failures = 0;
        if (finalState && entry.endGameUnsaved) {
          entry.endGameUnsaved = false;
          console.info('End-game state persisted after retry', { matchID });
        }
      } catch (error) {
        if (error instanceof StaleStateError) {
          // Memory holds a state PostgreSQL refused; reload from the database next time.
          this.entries.delete(matchID);
          if (entry.retryTimer) clearTimeout(entry.retryTimer);
          throw error;
        }
        entry.dirty = true;
        entry.failures += 1;
        if (finalState) {
          entry.endGameUnsaved = true;
          this.failed('end-game-write', matchID, error);
          this.scheduleEndGameRetry(matchID, entry);
        } else {
          this.failed('write', matchID, error, reportToSentry(entry.failures));
        }
        return;
      }
    }
  }

  private async writeWithRetry(row: MatchWrite, retryDelaysMs: number[]): Promise<void> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.sql.transaction((tx) => this.writeRow(tx, row));
        return;
      } catch (error) {
        if (error instanceof StaleStateError || attempt >= retryDelaysMs.length) throw error;
        await delay(retryDelaysMs[attempt]);
      }
    }
  }

  private async writeRow(tx: Tx, row: MatchWrite): Promise<void> {
    const storedStateID = await this.sql.lockStateId(tx, row.match_id);
    if (storedStateID === undefined) {
      await this.sql.insert(tx, row);
      return;
    }
    this.assertWritable(row.match_id, storedStateID, row.state_id);
    await this.sql.update(tx, row);
  }

  /**
   * The write guard, run inside the write transaction after the row lock.
   * Phase 1: reject a state older than the stored one; equal (metadata-only
   * write) and newer, including skipped versions, are accepted. Phase 2 adds
   * its owner check here, in the same transaction.
   */
  protected assertWritable(matchID: string, storedStateID: number, nextStateID: number): void {
    if (storedStateID > nextStateID) throw new StaleStateError(matchID);
  }

  private toRow(matchID: string, entry: Entry): MatchWrite {
    const { state } = entry;
    return {
      match_id: matchID,
      game_name: entry.metadata.gameName,
      game_version: GAME_VERSION,
      host_user_id: entry.hostUserId!,
      // The deltalog is per-update transport data, not match state.
      state: { ...state, deltalog: undefined },
      initial_state: entry.initialState,
      metadata: entry.metadata,
      result: state.ctx.gameover ?? null,
      state_id: state._stateID,
      is_gameover: isGameover(state),
    };
  }

  private scheduleEndGameRetry(matchID: string, entry: Entry): void {
    if (this.closed || entry.retryTimer) return;
    const wait = entry.retryDelayMs ?? this.opts.backgroundRetryMs;
    entry.retryDelayMs = Math.min(wait * 2, this.opts.backgroundRetryMaxMs);
    entry.retryTimer = setTimeout(() => {
      entry.retryTimer = undefined;
      if (this.entries.get(matchID) !== entry || !entry.endGameUnsaved) return;
      void this.persist(matchID, { endGameRetries: false })
        .then(() => {
          if (entry.endGameUnsaved) this.scheduleEndGameRetry(matchID, entry);
          else entry.retryDelayMs = undefined;
        })
        .catch(() => undefined);
    }, wait);
    entry.retryTimer.unref?.();
  }

  // ---- restore -------------------------------------------------------------

  /** Load a member match from PostgreSQL on first use after a restart. */
  private restore(matchID: string): Promise<Entry | undefined> {
    if (!this.ready) return Promise.reject(new MatchUnavailableError());
    const inFlight = this.restoring.get(matchID);
    if (inFlight) return inFlight;
    const loading = this.loadRow(matchID).finally(() => this.restoring.delete(matchID));
    this.restoring.set(matchID, loading);
    return loading;
  }

  private async loadRow(matchID: string): Promise<Entry | undefined> {
    let row;
    try {
      row = await this.sql.findRestorable(matchID, this.opts.resumeWindowHours);
      this.lastOperationFailed = false;
    } catch (error) {
      this.failed('restore', matchID, error);
      throw new MatchUnavailableError();
    }
    if (!row) return undefined;
    if (row.game_version !== GAME_VERSION) {
      // Refuse rather than run new rules on an old state shape (#446).
      reportPersistenceFailure('unknown-game-version', { matchID, level: 'warning' });
      return undefined;
    }
    const existing = this.entries.get(matchID);
    if (existing) return existing;
    const metadata = row.metadata as Server.MatchData;
    for (const player of Object.values(metadata.players ?? {})) {
      // Nobody is connected to a freshly restarted server.
      if (player.isConnected !== undefined) player.isConnected = false;
    }
    const entry: Entry = {
      hostUserId: row.host_user_id,
      state: row.state as State,
      initialState: row.initial_state as State,
      metadata,
      log: [],
      dirty: false,
      endGameUnsaved: false,
      failures: 0,
    };
    this.entries.set(matchID, entry);
    return entry;
  }

  // ---- helpers ---------------------------------------------------------------

  private async sweepAbandoned(): Promise<void> {
    if (!this.ready) return;
    try {
      await this.sql.markStaleAbandoned(this.opts.resumeWindowHours);
    } catch (error) {
      this.failed('mark-abandoned', undefined, error);
    }
  }

  private failed(
    operation: Parameters<typeof reportPersistenceFailure>[0],
    matchID: string | undefined,
    error: unknown,
    sentry = true,
  ) {
    this.lastOperationFailed = true;
    reportPersistenceFailure(operation, { matchID, error, sentry, level: operation === 'write' ? 'warning' : 'error' });
  }

  private schedule(fn: () => void, ms: number): void {
    if (this.closed) return;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    timer.unref?.();
    this.timers.add(timer);
  }
}
