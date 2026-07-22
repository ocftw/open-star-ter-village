import { ActionMoveName } from "@/game/core/stage/action/move/type";

interface ActionSlotRule {
  available: boolean;
}

interface ActionRule {
  actionCost: number;
}

interface ScoreWhenAction {
  victoryPoints: number;
}

interface InitialProject {
  projectOwnerWorkerCost: number;
}

interface AssignWorker {
  assignWorkerCost: number;
  initialContributionValue: number;
}

interface WorkerContribution {
  maxContributionValue: number;
}

interface ActionRules {
  createProject: ActionRule & InitialProject & AssignWorker & ScoreWhenAction;
  recruit: ActionRule & AssignWorker;
  contributeOwnedProjects: ActionRule & WorkerContribution;
  contributeJoinedProjects: ActionRule & WorkerContribution;
  removeAndRefillJobs: ActionRule & ScoreWhenAction;
}

export interface Rule {
  type: 'simple' | 'standard';
  action: ActionRules;
  numNonEndGameEventCards: number;
  table: {
    maxJobSlots: number;
    maxProjectSlots: number;
    actionSlots: Record<ActionMoveName, ActionSlotRule>;
  },
  player: {
    maxActionTokens: number;
    maxWorkerTokens: number;
    maxProjectCards: number;
    /** 加班 Overtime entitlements granted per action-turn refill. */
    overtimeTokens: number;
    /** Overtime may only repeat actions whose base cost is at most this many AP. */
    overtimeMaxActionCost: number;
  },
  settlement: {
    leftoverActionTokensVictoryPoints: number;
    projectOwnerVictoryPoints: number;
    lastContributorVictoryPoints: number;
  },
  event?: {
    extraOwnerVictoryPoints?: number;
    /** Per-player flag: each player independently gets one free worker placement ignoring job requirements. */
    ignoreFirstWorkerRequirement?: Record<string, boolean>;
  },
}

const initialState = (): Rule => {
  const actionRules: ActionRules = {
    createProject: {
      actionCost: 2,
      victoryPoints: 2,
      projectOwnerWorkerCost: 1,
      assignWorkerCost: 1,
      initialContributionValue: 1,
    },
    recruit: {
      actionCost: 1,
      assignWorkerCost: 1,
      initialContributionValue: 2,
    },
    contributeOwnedProjects: {
      actionCost: 1,
      maxContributionValue: 4,
    },
    contributeJoinedProjects: {
      actionCost: 1,
      maxContributionValue: 5,
    },
    removeAndRefillJobs: {
      actionCost: 1,
      victoryPoints: 1,
    },
  };

  const actionSlots: Record<ActionMoveName, ActionSlotRule> = {
    createProject: { available: true },
    recruit: { available: true },
    contributeOwnedProjects: { available: true },
    contributeJoinedProjects: { available: true },
    removeAndRefillJobs: { available: true },
  };

  return {
    type: 'simple',
    action: actionRules,
    numNonEndGameEventCards: 5,
    table: {
      maxJobSlots: 8,
      maxProjectSlots: 8,
      actionSlots,
    },
    player: {
      maxActionTokens: 4,
      maxWorkerTokens: 12,
      maxProjectCards: 2,
      overtimeTokens: 1,
      overtimeMaxActionCost: 1,
    },
    settlement: {
      leftoverActionTokensVictoryPoints: 0,
      projectOwnerVictoryPoints: 2,
      lastContributorVictoryPoints: 2,
    },
  };
}

/**
 * Returns the number of non-end-game event cards based on player count.
 * Per Simplified Mode rulebook:
 *   2 players → 6 cards, 3 players → 5 cards, 4 players → 4 cards
 */
export const getNumNonEndGameEventCardsByPlayerCount = (numPlayers: number): number => {
  if (numPlayers <= 2) return 6;
  if (numPlayers === 3) return 5;
  // 4+ players
  return 4;
};

const setNumNonEndGameEventCards = (rule: Rule, numPlayers: number): void => {
  rule.numNonEndGameEventCards = getNumNonEndGameEventCardsByPlayerCount(numPlayers);
};

const setSettlementLastContributorVictoryPoints = (rule: Rule, victoryPoints: number): void => {
  rule.settlement.lastContributorVictoryPoints = victoryPoints;
};

const setSettlementLeftoverActionTokensVictoryPoints = (rule: Rule, victoryPoints: number): void => {
  rule.settlement.leftoverActionTokensVictoryPoints = victoryPoints;
};

const incrementContributeOwnedProjectsMaxContributionValue = (rule: Rule): void => {
  rule.action.contributeOwnedProjects.maxContributionValue += 1;
};

const decrementContributeOwnedProjectsMaxContributionValue = (rule: Rule): void => {
  rule.action.contributeOwnedProjects.maxContributionValue -= 1;
};

const setEventExtraOwnerVictoryPoints = (rule: Rule, points: number): void => {
  if (!rule.event) {
    rule.event = {};
  }
  rule.event.extraOwnerVictoryPoints = points;
};

const setEventIgnoreFirstWorkerRequirement = (rule: Rule, playerIds: string[], value: boolean): void => {
  if (!rule.event) {
    rule.event = {};
  }
  if (value) {
    const perPlayer: Record<string, boolean> = {};
    for (const id of playerIds) {
      perPlayer[id] = true;
    }
    rule.event.ignoreFirstWorkerRequirement = perPlayer;
  } else {
    rule.event.ignoreFirstWorkerRequirement = undefined;
  }
};

const consumeIgnoreFirstWorkerRequirement = (rule: Rule, playerId: string): void => {
  if (rule.event?.ignoreFirstWorkerRequirement) {
    rule.event.ignoreFirstWorkerRequirement[playerId] = false;
  }
};

const canIgnoreFirstWorkerRequirement = (rule: Rule, playerId: string): boolean => {
  return rule.event?.ignoreFirstWorkerRequirement?.[playerId] ?? false;
};

const setTableMaxJobSlots = (rule: Rule, value: number): void => {
  rule.table.maxJobSlots = value;
};

const isStandardRule = (rule: Rule): boolean => {
  return rule.type === 'standard';
}

const getNonEndGameNumberOfEventCards = (rule: Rule): number => {
  return rule.numNonEndGameEventCards;
}

const isActionSlotAvailable = (rule: Rule, actionName: ActionMoveName): boolean => {
  return rule.table.actionSlots[actionName].available;
}

const getActionTokenCost = (rule: Rule, actionName: ActionMoveName): number => {
  return rule.action[actionName].actionCost;
}

const IsScoreWhenAction = (actionRule: any): actionRule is ScoreWhenAction => {
  return actionRule.victoryPoints !== undefined;
}

const getActionVictoryPoints = (rule: Rule, actionName: ActionMoveName): number => {
  const mayScoreWhenAction = rule.action[actionName];
  if (!IsScoreWhenAction(mayScoreWhenAction)) {
    throw new Error(`Score when action rule is not defined in ${actionName}`);
  }
  return mayScoreWhenAction.victoryPoints;
}

const IsInitialProject = (actionRule: any): actionRule is InitialProject => {
  return actionRule.projectOwnerWorkerCost !== undefined;
}

const getProjectOwnerWorkerTokenCost = (rule: Rule, actionName: ActionMoveName): number => {
  const mayInitialProject = rule.action[actionName];
  if (!IsInitialProject(mayInitialProject)) {
    throw new Error(`Initial project rule is not defined in ${actionName}`);
  }
  return mayInitialProject.projectOwnerWorkerCost;
}

const IsAssignWorker = (actionRule: any): actionRule is AssignWorker => {
  return actionRule.assignWorkerCost !== undefined && actionRule.initialContributionValue !== undefined;
}

const getAssignWorkerTokenCost = (rule: Rule, actionName: ActionMoveName): number => {
  const mayAssignWorker = rule.action[actionName];
  if (!IsAssignWorker(mayAssignWorker)) {
    throw new Error(`Assign worker rule is not defined in ${actionName}`);
  }
  return mayAssignWorker.assignWorkerCost;
}

const getAssignWorkerInitialContributionValue = (rule: Rule, actionName: ActionMoveName): number => {
  const mayAssignWorker = rule.action[actionName];
  if (!IsAssignWorker(mayAssignWorker)) {
    throw new Error(`Assign worker rule is not defined in ${actionName}`);
  }
  return mayAssignWorker.initialContributionValue;
}

const IsWorkerContribution = (actionRule: any): actionRule is WorkerContribution => {
  return actionRule.maxContributionValue !== undefined;
}

const getMaxContributionValue = (rule: Rule, actionName: ActionMoveName): number => {
  const mayWorkerContribution = rule.action[actionName];
  if (!IsWorkerContribution(mayWorkerContribution)) {
    throw new Error('Worker contribution rule is not defined');
  }
  return mayWorkerContribution.maxContributionValue;
}

const getTableMaxJobSlots = (rule: Rule): number => {
  return rule.table.maxJobSlots;
}

const getTableMaxProjectSlots = (rule: Rule): number => {
  return rule.table.maxProjectSlots;
}

const getPlayerMaxActionTokens = (rule: Rule): number => {
  return rule.player.maxActionTokens;
}

const getPlayerMaxWorkerTokens = (rule: Rule): number => {
  return rule.player.maxWorkerTokens;
}

const getPlayerMaxProjectCards = (rule: Rule): number => {
  return rule.player.maxProjectCards;
}

const getPlayerOvertimeTokens = (rule: Rule): number => {
  return rule.player.overtimeTokens;
}

const getOvertimeMaxActionCost = (rule: Rule): number => {
  return rule.player.overtimeMaxActionCost;
}

/** Total rounds in a game: one per non-end-game event card plus the end-game round. */
const getTotalRounds = (rule: Rule): number => {
  return rule.numNonEndGameEventCards + 1;
}

const getSettlementLeftoverActionTokensVictoryPoints = (rule: Rule): number => {
  return rule.settlement.leftoverActionTokensVictoryPoints;
}

const getSettlementProjectOwnerVictoryPoints = (rule: Rule): number => {
  return rule.settlement.projectOwnerVictoryPoints;
};

const getSettlementLastContributorVictoryPoints = (rule: Rule): number => {
  return rule.settlement.lastContributorVictoryPoints;
};

const RuleSlice = {
  initialState,
  mutators: {
    setNumNonEndGameEventCards,
    setSettlementLastContributorVictoryPoints,
    setSettlementLeftoverActionTokensVictoryPoints,
    incrementContributeOwnedProjectsMaxContributionValue,
    decrementContributeOwnedProjectsMaxContributionValue,
    setEventExtraOwnerVictoryPoints,
    setEventIgnoreFirstWorkerRequirement,
    consumeIgnoreFirstWorkerRequirement,
    setTableMaxJobSlots,
  },
  selectors: {
    isStandardRule,
    getNonEndGameNumberOfEventCards,
    isActionSlotAvailable,
    getActionTokenCost,
    getActionVictoryPoints,
    getProjectOwnerWorkerTokenCost,
    getAssignWorkerTokenCost,
    getAssignWorkerInitialContributionValue,
    getMaxContributionValue,
    canIgnoreFirstWorkerRequirement,
    getTableMaxJobSlots,
    getTableMaxProjectSlots,
    getPlayerMaxActionTokens,
    getPlayerMaxWorkerTokens,
    getPlayerMaxProjectCards,
    getPlayerOvertimeTokens,
    getOvertimeMaxActionCost,
    getTotalRounds,
    getSettlementLeftoverActionTokensVictoryPoints,
    getSettlementProjectOwnerVictoryPoints,
    getSettlementLastContributorVictoryPoints,
  },
};

export const RuleMutator = RuleSlice.mutators;
export const RuleSelector = RuleSlice.selectors;
export default RuleSlice;
