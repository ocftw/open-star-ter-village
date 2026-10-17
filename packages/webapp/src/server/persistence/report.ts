import * as Sentry from '@sentry/node';

// Never forward database errors: they can contain SQL parameters, including
// seat credentials, or a connection string. Report only fixed operation names.
type Operation = 'save' | 'connection' | 'startup' | 'unknown-game-version' | 'mark-abandoned';
export function reportPersistenceFailure(operation: Operation, matchID?: string): void {
  console.warn('Match persistence operation failed', { operation, matchID });
  Sentry.captureException(new Error(`Match persistence: ${operation}`), {
    tags: { component: 'match-persistence' },
    extra: { matchID },
  });
}
