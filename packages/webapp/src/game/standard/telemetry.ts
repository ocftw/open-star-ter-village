import type { PlayerID } from 'boardgame.io';
import type { ProjectCard } from '../card';
import type { GameState } from '../store/store';
import type { ProjectSlot } from '../store/slice/projectSlot/projectSlot';
import { ProjectSlotSelector } from '../store/slice/projectSlot/projectSlot';
import type { Choice, ChoiceKind } from './state';

export interface ProjectTelemetry {
  name: string;
  difficulty: number;
  initiator: PlayerID;
  initiatedRound: number;
  finisher?: PlayerID;
  completedRound?: number;
  /** Each player's contribution when the project completed. */
  contributions?: Record<PlayerID, number>;
}

/** Per choice kind; each Government 5 point is its own choice, so queued = resolved + skipped + noTarget. */
export interface ChoiceTelemetry {
  queued: number;
  resolved: number;
  skipped: number;
  /** Dropped automatically because no legal target existed. */
  noTarget: number;
}

/**
 * Balance data for playtests. Server-only: playerView strips it, so only the
 * bot runner and the debug endpoint can read it.
 */
export interface StandardTelemetry {
  projects: Record<string, ProjectTelemetry>;
  firstOver20Round: Record<PlayerID, number>;
  advancedDraws: Record<PlayerID, number>;
  choices: Partial<Record<ChoiceKind, ChoiceTelemetry>>;
  government5: { budget: number; used: number };
}

export const emptyTelemetry = (): StandardTelemetry => ({
  projects: {}, firstOver20Round: {}, advancedDraws: {}, choices: {}, government5: { budget: 0, used: 0 },
});

// Matches created before telemetry existed have none; every tracker is a no-op for them.
const telemetry = (G: GameState) => G.standard?.telemetry;
const choiceStats = (t: StandardTelemetry, kind: ChoiceKind) => (t.choices[kind] ??= { queued: 0, resolved: 0, skipped: 0, noTarget: 0 });

export function trackInitiation(G: GameState, card: ProjectCard, playerId: PlayerID) {
  const t = telemetry(G);
  if (t) t.projects[card.id] = { name: card.name, difficulty: card.difficulty, initiator: playerId, initiatedRound: G.standard!.round };
}

export function trackCompletion(G: GameState, slot: ProjectSlot) {
  const project = telemetry(G)?.projects[slot.card!.id];
  if (!project) return;
  project.finisher = slot.lastContributor;
  project.completedRound = G.standard!.round;
  project.contributions = Object.fromEntries(ProjectSlotSelector.getContributors(slot).map(id => [id, ProjectSlotSelector.getPlayerContribution(slot, id)]));
}

export function trackQueued(G: GameState, kind: ChoiceKind, budget: number) {
  const t = telemetry(G);
  if (!t) return;
  choiceStats(t, kind).queued++;
  if (kind === 'government5') t.government5.budget += budget;
}

export function trackResolved(G: GameState, choice: Choice, skipped: boolean) {
  const t = telemetry(G);
  if (!t) return;
  choiceStats(t, choice.kind)[skipped ? 'skipped' : 'resolved']++;
  if (choice.kind === 'government5' && !skipped) t.government5.used++;
}

export function trackNoTarget(G: GameState, choice: Choice) {
  const t = telemetry(G);
  if (t) choiceStats(t, choice.kind).noTarget++;
}

export function trackAdvancedDraw(G: GameState, playerId: PlayerID) {
  const t = telemetry(G);
  if (t) t.advancedDraws[playerId] = (t.advancedDraws[playerId] ?? 0) + 1;
}

export function trackScores(G: GameState) {
  const t = telemetry(G);
  if (!t) return;
  for (const [playerId, score] of Object.entries(G.table.scoreBoard)) {
    if (score > 20 && t.firstOver20Round[playerId] === undefined) t.firstOver20Round[playerId] = G.standard!.round;
  }
}
