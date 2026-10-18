import { InMemory } from 'boardgame.io/server';
import type { LogEntry, Server, State } from 'boardgame.io';
import type { StorageAPI } from 'boardgame.io';
import type { Pool } from 'pg';
import { reportPersistenceFailure } from './report';
import { hostIdentity } from './hostIdentity';

// Saved-state format version, independent of the application release number.
export const GAME_VERSION = '1';
export type MemberMetadata = Server.MatchData & { host_user_id?: string };
export interface SavedMatch {
  match_id: string;
  game_name: string;
  game_version: string;
  host_user_id: string;
  state: State;
  initial_state: State;
  metadata: MemberMetadata;
  abandoned_at: Date | null;
}
interface SaveQueue {
  pending: SavedMatch | undefined;
  running: boolean;
  failures: number;
  retry?: ReturnType<typeof setTimeout>;
}

export class PersistentStore extends InMemory {
  private queues = new Map<string, SaveQueue>();
  private idleListeners = new Set<() => void>();

  constructor(private readonly pool: Pick<Pool, 'query'>) {
    super();
  }

  override createMatch(matchID: string, opts: StorageAPI.CreateMatchOpts): void {
    const host = hostIdentity.getStore() ?? (opts.metadata as MemberMetadata).host_user_id;
    super.createMatch(matchID, {
      ...opts, metadata: { ...opts.metadata, ...(host ? { host_user_id: host } : {}) },
    });
    this.enqueue(matchID);
  }

  override setState(matchID: string, state: State, deltalog?: LogEntry[]): void {
    super.setState(matchID, state, deltalog);
    this.enqueue(matchID);
  }

  override setMetadata(matchID: string, metadata: MemberMetadata): void {
    const host = (this.metadata.get(matchID) as MemberMetadata | undefined)?.host_user_id;
    super.setMetadata(matchID, host ? { ...metadata, host_user_id: host } : metadata);
    this.enqueue(matchID);
  }

  override wipe(matchID: string): void {
    const saved = this.snapshot(matchID);
    super.wipe(matchID);
    this.initial.delete(matchID);
    this.log.delete(matchID);
    // Retain the database row, but do not resurrect a removed lobby match.
    if (saved) this.schedule({ ...saved, abandoned_at: new Date() });
  }

  restore(saved: SavedMatch): void {
    // Bypass overrides so startup loading never writes the loaded rows back.
    this.initial.set(saved.match_id, saved.initial_state);
    super.setState(saved.match_id, saved.state);
    const metadata: MemberMetadata = { ...saved.metadata, host_user_id: saved.host_user_id };
    super.setMetadata(saved.match_id, metadata);
  }

  pendingMatchIDs(): string[] {
    return Array.from(this.queues.keys());
  }

  flush(): Promise<void> {
    if (this.queues.size === 0) return Promise.resolve();
    return new Promise(resolve => this.idleListeners.add(resolve));
  }

  private snapshot(matchID: string): SavedMatch | undefined {
    const metadata = this.metadata.get(matchID) as MemberMetadata | undefined;
    const state = this.state.get(matchID);
    const initialState = this.initial.get(matchID);
    if (!metadata?.host_user_id || !state || !initialState) return;
    return {
      match_id: matchID,
      game_name: metadata.gameName,
      game_version: GAME_VERSION,
      host_user_id: metadata.host_user_id,
      state,
      initial_state: initialState,
      metadata,
      abandoned_at: null,
    };
  }

  private enqueue(matchID: string): void {
    const saved = this.snapshot(matchID);
    if (saved) this.schedule(saved);
  }

  private schedule(saved: SavedMatch): void {
    let queue = this.queues.get(saved.match_id);
    if (!queue) {
      queue = { pending: undefined, running: false, failures: 0 };
      this.queues.set(saved.match_id, queue);
    }
    queue.pending = saved;
    if (!queue.running && !queue.retry) {
      queue.running = true;
      // Coalesce synchronous create/state/metadata updates before serializing.
      queueMicrotask(() => { void this.save(saved.match_id, queue!); });
    }
  }

  private async save(matchID: string, queue: SaveQueue): Promise<void> {
    const saved = queue.pending!;
    queue.pending = undefined;
    try {
      await this.pool.query(`
        insert into matches (match_id, game_name, game_version, host_user_id,
          state, initial_state, metadata, result, state_id, is_gameover, abandoned_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict (match_id) do update set
          game_name = excluded.game_name, game_version = excluded.game_version,
          host_user_id = excluded.host_user_id, initial_state = excluded.initial_state,
          state = excluded.state, metadata = excluded.metadata,
          result = excluded.result, state_id = excluded.state_id,
          is_gameover = excluded.is_gameover, abandoned_at = excluded.abandoned_at,
          updated_at = now()
      `, [saved.match_id, saved.game_name, saved.game_version, saved.host_user_id,
        JSON.stringify(saved.state), JSON.stringify(saved.initial_state),
        JSON.stringify(saved.metadata),
        saved.state.ctx.gameover === undefined ? null : JSON.stringify(saved.state.ctx.gameover),
        saved.state._stateID, saved.state.ctx.gameover !== undefined, saved.abandoned_at]);
      queue.failures = 0;
    } catch {
      reportPersistenceFailure('save', matchID);
      queue.pending ??= saved;
      queue.running = false;
      const delay = Math.min(250 * 2 ** Math.min(queue.failures++, 7), 30000);
      queue.retry = setTimeout(() => {
        queue.retry = undefined;
        queue.running = true;
        void this.save(matchID, queue);
      }, delay);
      return;
    }
    if (queue.pending) {
      void this.save(matchID, queue);
    } else {
      this.queues.delete(matchID);
      if (this.queues.size === 0) {
        this.idleListeners.forEach(resolve => resolve());
        this.idleListeners.clear();
      }
    }
  }
}
