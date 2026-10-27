import { DEFAULT_EXPERIMENTS } from './config';
import type { Ctx } from 'boardgame.io';
import type { ClientGameState, GameState } from '../store/store';
import type { StandardTelemetry } from './telemetry';

export function treeOutcome(remainingHearts: number): string {
  return remainingHearts === 0 ? '星源樹繁盛' : remainingHearts <= 3 ? '星源樹發光' : remainingHearts <= 6 ? '星源樹甦醒中' : '星源樹枯萎';
}

export interface ExportOptions {
  build: string;
  now?: number;
  /** Only the bot runner and debug mode pass this; the player export never includes it. */
  telemetry?: StandardTelemetry;
}

/** Public game summary shared by the player export button, the bot runner and debug mode. */
export function buildStandardExport(G: GameState | ClientGameState, ctx: Ctx, { build, now = Date.now(), telemetry }: ExportOptions) {
  const s = G.standard!;
  const remainingHearts = 10 - s.grown.length;
  return {
    ruleset: s.version, experiments: { ...(s.experiments ?? DEFAULT_EXPERIMENTS) }, build, players: ctx.numPlayers, rounds: s.round,
    completedProjectIds: s.completedProjectIds, grown: s.grown, remainingHearts, scores: G.table.scoreBoard,
    outcome: treeOutcome(remainingHearts), finished: Boolean(ctx.gameover), log: s.log, exportedAt: new Date(now).toISOString(),
    durationSeconds: Math.floor(((s.finishedAt ?? now) - s.startedAt) / 1000),
    ...(telemetry ? { telemetry } : {}),
  };
}

export type StandardExport = ReturnType<typeof buildStandardExport>;
