import type { GameState } from './game/store/store';

/** Opt-in switch for the telemetry debug endpoint. Set only on test deployments. */
export const DEBUG_TELEMETRY_ENV = 'DEBUG_TELEMETRY';
export const DEBUG_TELEMETRY_PATH = '/debug/matches/:matchID/telemetry';

interface MatchStore {
  fetch(matchID: string, opts: { state: true }): unknown;
}

interface DebugContext {
  params: Record<string, string>;
  status: number;
  body: unknown;
}

/**
 * Serves a match's server-only balance telemetry. Registered only when
 * DEBUG_TELEMETRY=1; without it the route does not exist (404).
 */
export function debugTelemetryHandler(db: MatchStore) {
  return async (ctx: DebugContext) => {
    const result = (await db.fetch(ctx.params.matchID, { state: true })) as { state?: { G: GameState } } | undefined;
    const standard = result?.state?.G.standard;
    if (!standard?.telemetry) {
      ctx.status = 404;
      return;
    }
    ctx.body = { matchID: ctx.params.matchID, round: standard.round, telemetry: standard.telemetry };
  };
}
