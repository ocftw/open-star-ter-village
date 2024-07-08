import { ActionMoveName } from "@/game/core/stage/action/move/type";

interface ActionSlotRule {
  available: boolean;
  actionCost: number;
  workerCost: number;
}

interface ActionRule {
  victoryPoints: number;
}

interface InitialContribution {
  initialContributionValue: number;
}

interface MaxContribution {
  maxContributionValue: number;
}

export interface Rule {
  action: {
    createProject: ActionRule & InitialContribution,
    recruit: ActionRule & InitialContribution,
    contributeOwnedProjects: ActionRule & MaxContribution,
    contributeJoinedProjects: ActionRule & MaxContribution,
    removeAndRefillJobs: ActionRule,
    mirror: ActionRule,
  },
  table: {
    maxJobSlots: number;
    maxProjectSlots: number;
    actionSlots: Record<ActionMoveName, ActionSlotRule>,
  },
  player: {
    maxActionTokens: number;
    maxWorkerTokens: number;
    maxProjectCards: number;
  },
}

const initialState = (): Rule => {
  const actionRules = {
    createProject: {
      victoryPoints: 2,
      initialContributionValue: 1,
    },
    recruit: {
      victoryPoints: 0,
      initialContributionValue: 2,
    },
    contributeOwnedProjects: {
      victoryPoints: 0,
      maxContributionValue: 4,
    },
    contributeJoinedProjects: {
      victoryPoints: 0,
      maxContributionValue: 5,
    },
    removeAndRefillJobs: {
      victoryPoints: 1,
    },
    mirror: {
      victoryPoints: 0,
    },
  };

  const actionSlots: Record<ActionMoveName, ActionSlotRule> = {
    createProject: { available: true, actionCost: 2, workerCost: 2 },
    recruit: { available: true, actionCost: 1, workerCost: 1 },
    contributeOwnedProjects: { available: true, actionCost: 1, workerCost: 1 },
    contributeJoinedProjects: { available: true, actionCost: 1, workerCost: 1 },
    removeAndRefillJobs: { available: true, actionCost: 1, workerCost: 1 },
    mirror: { available: true, actionCost: 1, workerCost: 1 },
  };

  return {
    action: actionRules,
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
  };
}

const isActionSlotAvailable = (rule: Rule, actionName: ActionMoveName): boolean => {
  return rule.table.actionSlots[actionName].available;
}

const getActionTokenCost = (rule: Rule, actionName: ActionMoveName): number => {
  return rule.table.actionSlots[actionName].actionCost;
}

const getWorkerTokenCost = (rule: Rule, actionName: ActionMoveName): number => {
  return rule.table.actionSlots[actionName].workerCost;
}

const getActionVictoryPoints = (rule: Rule, actionName: ActionMoveName): number => {
  return rule.action[actionName].victoryPoints;
}

const getCreateProjectInitialContributionValue = (rule: Rule): number => {
  return rule.action.createProject.initialContributionValue;
}

const getRecruitInitialContributionValue = (rule: Rule): number => {
  return rule.action.recruit.initialContributionValue;
}

const getContributeOwnedProjectsMaxContributionValue = (rule: Rule): number => {
  return rule.action.contributeOwnedProjects.maxContributionValue;
}

const getContributeJoinedProjectsMaxContributionValue = (rule: Rule): number => {
  return rule.action.contributeJoinedProjects.maxContributionValue;
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

const RuleSlice = {
  initialState,
  selectors: {
    isActionSlotAvailable,
    getActionTokenCost,
    getWorkerTokenCost,
    getActionVictoryPoints,
    getCreateProjectInitialContributionValue,
    getRecruitInitialContributionValue,
    getContributeOwnedProjectsMaxContributionValue,
    getContributeJoinedProjectsMaxContributionValue,
    getTableMaxJobSlots,
    getTableMaxProjectSlots,
    getPlayerMaxActionTokens,
    getPlayerMaxWorkerTokens,
    getPlayerMaxProjectCards,
  },
};

export const RuleSelector = RuleSlice.selectors;
export default RuleSlice;
