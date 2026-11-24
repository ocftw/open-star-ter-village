import type { ListFilter, MatchesSql, MatchRow, MatchWrite, Tx } from './matchesSql';

/**
 * Test-only in-memory stand-in for the `matches` table, so the store's rules
 * run in CI without PostgreSQL. `failNext`/`failAll` inject transient
 * failures; `statements` records every call made inside a write transaction.
 */
export class FakeMatchesSql implements MatchesSql {
  rows = new Map<string, MatchRow & { abandoned: boolean; updatedAt: number }>();
  migrations = 0;
  closed = false;
  statements: string[] = [];
  writes: MatchWrite[] = [];
  private failures = 0;
  failAll = false;
  migrateFails = false;
  /** Delay applied to every write transaction (ms). */
  writeDelayMs = 0;
  now = () => Date.now();

  /** Fail the next `n` write transactions with a connection-style error. */
  failNext(n = 1): void {
    this.failures += n;
  }

  private maybeFail(): void {
    if (this.failAll || this.failures > 0) {
      if (this.failures > 0) this.failures -= 1;
      throw Object.assign(new Error('connect ECONNREFUSED (fake)'), { code: '08006' });
    }
  }

  async migrate(): Promise<void> {
    if (this.migrateFails || this.failAll) throw Object.assign(new Error('fake migrate failure'), { code: '08006' });
    this.migrations += 1;
  }

  async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    if (this.writeDelayMs) await new Promise((resolve) => setTimeout(resolve, this.writeDelayMs));
    this.maybeFail();
    this.statements.push('begin');
    const result = await fn('tx');
    this.statements.push('commit');
    return result;
  }

  async lockStateId(_tx: Tx, matchID: string): Promise<number | undefined> {
    this.statements.push('lockStateId');
    return this.rows.get(matchID)?.state_id;
  }

  async insert(_tx: Tx, row: MatchWrite): Promise<void> {
    this.statements.push('insert');
    this.writes.push(row);
    this.rows.set(row.match_id, { ...clone(row), abandoned: false, updatedAt: this.now() });
  }

  async update(_tx: Tx, row: MatchWrite): Promise<void> {
    this.statements.push('update');
    this.writes.push(row);
    const existing = this.rows.get(row.match_id)!;
    this.rows.set(row.match_id, { ...existing, ...clone(row), initial_state: existing.initial_state, abandoned: false, updatedAt: this.now() });
  }

  private restorable(row: { abandoned: boolean; updatedAt: number }, hours: number): boolean {
    return !row.abandoned && row.updatedAt > this.now() - hours * 3_600_000;
  }

  async findRestorable(matchID: string, hours: number): Promise<MatchRow | undefined> {
    this.maybeFailReads();
    const row = this.rows.get(matchID);
    return row && this.restorable(row, hours) ? clone(row) : undefined;
  }

  async listRestorable(filter: ListFilter): Promise<string[]> {
    this.maybeFailReads();
    return Array.from(this.rows.values())
      .filter((row) => this.restorable(row, filter.resumeWindowHours) && row.game_version === filter.gameVersion)
      .filter((row) => !filter.gameName || row.game_name === filter.gameName)
      .filter((row) => filter.isGameover === undefined || row.is_gameover === filter.isGameover)
      .map((row) => row.match_id);
  }

  async listUnknownVersions(gameVersion: string, hours: number): Promise<string[]> {
    return Array.from(this.rows.values())
      .filter((row) => this.restorable(row, hours) && row.game_version !== gameVersion)
      .map((row) => row.match_id);
  }

  async markAbandoned(matchID: string): Promise<void> {
    const row = this.rows.get(matchID);
    if (row) row.abandoned = true;
  }

  async markStaleAbandoned(hours: number): Promise<number> {
    let count = 0;
    this.rows.forEach((row) => {
      if (!row.is_gameover && !row.abandoned && row.updatedAt <= this.now() - hours * 3_600_000) {
        row.abandoned = true;
        count += 1;
      }
    });
    return count;
  }

  async deleteRow(matchID: string): Promise<void> {
    this.maybeFail();
    this.rows.delete(matchID);
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  private maybeFailReads(): void {
    if (this.failAll) throw Object.assign(new Error('fake read failure'), { code: '08006' });
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
