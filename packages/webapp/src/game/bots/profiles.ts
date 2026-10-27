import type { NodeId } from '@/game/standard/state';

/** Tunable weights for a scoring bot. A strategy is a named set of these. */
export interface Weights {
  /** Multiplier on the bot's own immediate and expected points. */
  points: number;
  /** Completion chance of an empty project; grows linearly as positions fill (capped at 0.95, lower in the last two rounds). */
  baseCompletionChance: number;
  /** Share of a benefit to other players that the bot also values (shared tree, village goals). */
  village: number;
  /** Value of one more village-wide completion, which unlocks higher tree tiers. */
  villageCompletion: number;
  /** Multiplier on tree node value. */
  tree: number;
  /** Multiplier on the reward of tier-above nodes a growth makes reachable. */
  unlock: number;
  /** Points one AP is assumed to earn; converts tree consequences into points. */
  pointsPerAP: number;
  /** Opportunity cost per AP spent; never below the leftover-AP score of the last round. */
  apCost: number;
  /** Penalty for redeeming the overtime token. */
  overtime: number;
  /** Value of keeping one worker token. */
  workerToken: number;
  /** Value of placing a cube, which enables later joined contributions. */
  presence: number;
  /** Extra value for starting a project, on top of its points. */
  initiation: number;
  /** Preference for the advanced project pile over the entry pile. */
  advancedDraw: number;
  /** Penalty per still-needed job card removed from the market. */
  marketLoss: number;
}

export interface Profile {
  name: string;
  weights: Weights;
  /** Estimated gain, in AP per round, of each tree ability for every player it applies to. */
  nodeImpact: Record<NodeId, number>;
}

/** Initial guesses; recalibrate from batch results (points per AP, ability trigger rates). */
export const DEFAULT_NODE_IMPACT: Record<NodeId, number> = {
  'source-1': 0.2, // job market 6 → 8
  'source-2': 0.3, // joined contribution cap 4 → 5
  'source-3': 0.4, // engineer starts at 3 instead of 1
  'source-4': 0.4, // finisher pushes another engineer cube
  'source-5': 0.6, // starting a project costs 1 AP instead of 2
  'data-1': 0.2, // hand cap 2 → 3
  'data-2': 0.5, // recruits contribute 2 instead of 1
  'data-3': 1.0, // 4 action tokens instead of 3
  'data-4': 0.3, // owner contribution cap 3 → 4
  'data-5': 0.3, // any job card can start a project
  'government-1': 0.1, // discard one project card and redraw
  'government-2': 0.1, // preview the next event
  'government-3': 0.2, // project space 6 → 8
  'government-4': 0.5, // free recruit after starting a project
  'government-5': 0.5, // redistribute half the owner's contribution
};

export const BALANCED: Profile = {
  name: 'balanced',
  weights: {
    points: 1,
    baseCompletionChance: 0.25,
    village: 0.3,
    villageCompletion: 1,
    tree: 1,
    unlock: 0.5,
    pointsPerAP: 1,
    apCost: 0.3,
    overtime: 0.1,
    workerToken: 0.2,
    presence: 0.5,
    initiation: 0,
    advancedDraw: -0.5,
    marketLoss: 0.2,
  },
  nodeImpact: DEFAULT_NODE_IMPACT,
};

export const PROFILES: Record<string, Profile> = { balanced: BALANCED };

/** A profile with some weights overridden, e.g. from CLI JSON. */
export function withWeights(profile: Profile, overrides: Partial<Weights>): Profile {
  return { ...profile, weights: { ...profile.weights, ...overrides } };
}
