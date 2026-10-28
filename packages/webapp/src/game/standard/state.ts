import type { StandardExperiments } from './config';
import type { StandardOptions } from './options';
import type { EventCard } from '../card';
import { emptyTelemetry, type StandardTelemetry } from './telemetry';
export type Branch = 'source' | 'data' | 'government';
export type NodeId = `${Branch}-${1 | 2 | 3 | 4 | 5}`;
export type ChoiceKind = 'extraRecruit' | 'digitalMinister' | 'government4' | 'source4' | 'government5' | 'discard' | 'draw';
export interface Choice { id: number; kind: ChoiceKind; playerId: string; projectId?: string; budget: number }
export interface PublicLog { round: number; kind: string; playerId?: string; target?: string }
export interface StandardState {
  version: 'tree-poc-v1';
  experiments?: StandardExperiments;
  /** Absent only in legacy serialized matches; never rewrite their settings. */
  options?: StandardOptions;
  completedComplexity?: number;
  startedAt: number;
  finishedAt?: number;
  grown: NodeId[];
  completedProjectIds: string[];
  choices: Choice[];
  nextChoiceId: number;
  phase: 'action' | 'event' | 'settlement' | 'restore' | 'ready';
  growthUsed: boolean;
  round: number;
  log: PublicLog[];
  nextEvent?: EventCard;
  extraRecruitUsed?: Record<string, boolean>;
  /** Server-only balance data; stripped by playerView. */
  telemetry?: StandardTelemetry;
}
export const standardState = (): StandardState => ({
  version: 'tree-poc-v1', startedAt: Date.now(), grown: [], completedProjectIds: [], choices: [], nextChoiceId: 1,
  phase: 'action', growthUsed: false, round: 0, log: [], telemetry: emptyTelemetry(),
});
