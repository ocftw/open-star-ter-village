export interface PersistenceConfig {
  enabled: boolean;
  resumeWindowHours: number;
}

export class PersistenceConfigError extends Error {}

export function persistenceConfig(env: Record<string, string | undefined>): PersistenceConfig {
  const enabled = env.MATCH_PERSISTENCE !== 'off' && Boolean(env.DATABASE_URL);
  if (enabled && env.MATCH_PERSISTENCE && env.MATCH_PERSISTENCE !== 'member') {
    throw new PersistenceConfigError('MATCH_PERSISTENCE must be member or off');
  }
  const hours = env.MATCH_RESUME_WINDOW_HOURS === undefined ? 24 : Number(env.MATCH_RESUME_WINDOW_HOURS);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new PersistenceConfigError('MATCH_RESUME_WINDOW_HOURS must be a positive number');
  }
  return { enabled, resumeWindowHours: hours };
}
