import * as Sentry from '@sentry/node';

/**
 * Fixed operation names. Database errors are never forwarded: their messages
 * and parameters can contain seat credentials (metadata) or the connection
 * string. Only the operation, the match ID and a SQLSTATE code are reported.
 */
export type PersistenceOperation =
  | 'connect'
  | 'migrate'
  | 'restore'
  | 'list'
  | 'write'
  | 'end-game-write'
  | 'stale-state-rejected'
  | 'unknown-game-version'
  | 'mark-abandoned'
  | 'abandon'
  | 'set-host'
  | 'shutdown';

const SQLSTATE = /^[0-9A-Z]{5}$/;

export function errorCode(error: unknown): string | undefined {
  const code = (error as { original?: { code?: unknown }; parent?: { code?: unknown }; code?: unknown } | null)?.original?.code
    ?? (error as { parent?: { code?: unknown } } | null)?.parent?.code
    ?? (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && SQLSTATE.test(code) ? code : undefined;
}

export function reportPersistenceFailure(
  operation: PersistenceOperation,
  details: { matchID?: string; error?: unknown; level?: 'warning' | 'error' } = {},
): void {
  const code = errorCode(details.error);
  console.warn('Match persistence operation failed', { operation, matchID: details.matchID, code });
  Sentry.captureException(new Error(`Match persistence: ${operation}`), {
    level: details.level ?? 'error',
    tags: { component: 'match-persistence', operation },
    extra: { matchID: details.matchID, code },
  });
}
