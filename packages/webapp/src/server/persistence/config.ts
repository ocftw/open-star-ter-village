export type PersistenceMode = 'off' | 'member';

export interface PersistenceConfig {
  mode: PersistenceMode;
  databaseUrl?: string;
  /** Restore window and abandoned-marking age, in hours. */
  resumeWindowHours: number;
}

/** Fixed-message configuration error; safe to log and report (no env values). */
export class PersistenceConfigError extends Error {
  name = 'PersistenceConfigError';
}

export const DEFAULT_RESUME_WINDOW_HOURS = 24;

/**
 * MATCH_PERSISTENCE is `member` or `off`. It defaults to `member` when
 * DATABASE_URL is set and `off` otherwise; `off` (or no DATABASE_URL) never
 * opens a database connection.
 */
export function readPersistenceConfig(env: Record<string, string | undefined>): PersistenceConfig {
  const requested = env.MATCH_PERSISTENCE?.trim() || undefined;
  if (requested !== undefined && requested !== 'off' && requested !== 'member') {
    throw new PersistenceConfigError('MATCH_PERSISTENCE must be member or off');
  }
  const rawHours = env.MATCH_RESUME_WINDOW_HOURS?.trim();
  const resumeWindowHours = rawHours ? Number(rawHours) : DEFAULT_RESUME_WINDOW_HOURS;
  if (!Number.isFinite(resumeWindowHours) || resumeWindowHours <= 0) {
    throw new PersistenceConfigError('MATCH_RESUME_WINDOW_HOURS must be a positive number');
  }
  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  const mode: PersistenceMode = requested === 'off' || !databaseUrl ? 'off' : 'member';
  return { mode, databaseUrl: mode === 'member' ? databaseUrl : undefined, resumeWindowHours };
}
