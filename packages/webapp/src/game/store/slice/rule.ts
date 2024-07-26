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
  mirror: ActionRule;
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
  },
  settlement: {
    leftoverActionTokensVictoryPoints: number;
    projectOwnerVictoryPoints: number;
    lastContributorVictoryPoints: number;
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
    mirror: {
      actionCost: 1,
    },
  };

  const actionSlots: Record<ActionMoveName, ActionSlotRule> = {
    createProject: { available: true },
    recruit: { available: true },
    contributeOwnedProjects: { available: true },
    contributeJoinedProjects: { available: true },
    removeAndRefillJobs: { available: true },
    mirror: { available: false },
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
    },
    settlement: {
      leftoverActionTokensVictoryPoints: 0,
      projectOwnerVictoryPoints: 2,
      lastContributorVictoryPoints: 2,
    },
  };
}

const setSettlementLastContributorVictoryPoints = (rule: Rule, victoryPoints: number): void => {
  rule.settlement.lastContributorVictoryPoints = victoryPoints;
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
    setSettlementLastContributorVictoryPoints,
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
    getTableMaxJobSlots,
    getTableMaxProjectSlots,
    getPlayerMaxActionTokens,
    getPlayerMaxWorkerTokens,
    getPlayerMaxProjectCards,
    getSettlementLeftoverActionTokensVictoryPoints,
    getSettlementProjectOwnerVictoryPoints,
    getSettlementLastContributorVictoryPoints,
  },
};

export const RuleMutator = RuleSlice.mutators;
export const RuleSelector = RuleSlice.selectors;
export default RuleSlice;
