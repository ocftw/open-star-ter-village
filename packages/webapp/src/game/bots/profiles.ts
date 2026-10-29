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

/**
 * Pace planning from the current rules and rounds left. Profiles without it
 * keep the fixed completion chance and the flat `advancedDraw` preference.
 */
export interface Planner {
  /** Share of the bot's remaining AP it expects to put into any one project. */
  focus: number;
  /** Share of another contributor's AP the bot expects them to put into a project they joined. */
  helperShare: number;
  /** Points one AP is assumed to earn elsewhere; the cost of AP a new project ties up. */
  apValue: number;
}

export interface Profile {
  name: string;
  weights: Weights;
  /** Estimated gain, in AP per round, of each tree ability for every player it applies to. */
  nodeImpact: Record<NodeId, number>;
  planner?: Planner;
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

export const NOVICE: Profile = {
  name: 'novice',
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

/**
 * Advance: Novice's scoring tuned to beat Novice, above all from the early
 * seats where Novice loses to the players after it. It gives no value to
 * what tree abilities give other players or to the tiers a growth unlocks,
 * weights the shared tree at 0.6, and pays 1 point to open a project, so its
 * actions go to completing its own projects before later seats can.
 */
export const ADVANCE: Profile = {
  ...withWeights(NOVICE, { village: 0, tree: 0.6, unlock: 0, initiation: -1 }),
  name: 'advance',
};

/**
 * Strategist: Advance's weights plus pace planning. It judges whether a
 * project can still be finished from the AP it and the project's other
 * contributors have left under the current rules (tree abilities included),
 * chooses the project pile whose cards are worth most in the rounds left, and
 * values a tree ability by its AP at `apValue` plus what it speeds up in the
 * bot's own projects, without Advance's 0.6 tree discount.
 */
export const STRATEGIST: Profile = {
  ...withWeights(ADVANCE, { tree: 1 }),
  name: 'strategist',
  planner: { focus: 0.6, helperShare: 0.25, apValue: 2 },
};

export const PROFILES: Record<string, Profile> = { novice: NOVICE, advance: ADVANCE, strategist: STRATEGIST };

/** A profile with some weights overridden, e.g. from CLI JSON. */
export function withWeights(profile: Profile, overrides: Partial<Weights>): Profile {
  return { ...profile, weights: { ...profile.weights, ...overrides } };
}
