import { PlayerID } from 'boardgame.io';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { ActionExecutionOptions, invalid, VALID, ValidatableState, ValidationResult } from './types';

/**
 * Shared pure validators for every action move. The server moves and
 * the client preflight both call these, so rules cannot drift between the two.
 * Each returns the FIRST failure in the same order the moves check them.
 */

type SlotOptions = ActionExecutionOptions;

const validateSlotAndActionTokens = (
  G: ValidatableState,
  playerID: PlayerID,
  actionName: ActionMoveName,
  opts?: SlotOptions,
): ValidationResult => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, actionName)) {
    return invalid('ACTION_UNAVAILABLE');
  }
  const occupied = ActionSlotSelector.isOccupied(G.table.actionSlots[actionName]);
  if (opts?.useOvertime && occupied) {
    // 加班 Overtime: repeat an occupied action by redeeming the per-player
    // token; the only AP charged is the action's own cost (checked below).
    if (PlayersSelector.getNumOvertimeTokens(G.players, playerID) < 1) {
      return invalid('OVERTIME_UNAVAILABLE');
    }
    const cost = RuleSelector.getActionTokenCost(G.rules, actionName);
    if (cost > RuleSelector.getOvertimeMaxActionCost(G.rules)) {
      return invalid('OVERTIME_INELIGIBLE_ACTION', { cost });
    }
  } else if (occupied) {
    return invalid('ACTION_OCCUPIED');
  }
  const required = RuleSelector.getActionTokenCost(G.rules, actionName);
  const available = PlayersSelector.getNumActionTokens(G.players, playerID);
  if (available < required) {
    return invalid('INSUFFICIENT_ACTION_TOKENS', { required, available });
  }
  return VALID;
};

export const validateCreateProject = (
  G: ValidatableState,
  playerID: PlayerID,
  projectCardId: string,
  jobCardId: string,
  assignedJobName?: string,
  opts?: SlotOptions,
): ValidationResult => {
  const base = validateSlotAndActionTokens(G, playerID, 'createProject', opts);
  if (!base.valid) return base;

  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  const requiredWorkers = projectOwnerWorkerTokenCosts + assignWorkerTokenCosts;
  const availableWorkers = PlayersSelector.getNumWorkerTokens(G.players, playerID);
  if (availableWorkers < requiredWorkers) {
    return invalid('INSUFFICIENT_WORKER_TOKENS', { required: requiredWorkers, available: availableWorkers });
  }

  if (G.table.projectBoard.every((slot) => slot.card)) {
    return invalid('PROJECT_BOARD_FULL');
  }

  const projectCard = PlayersSelector.getProjectCardById(G.players, playerID, projectCardId);
  if (!projectCard) {
    return invalid('PROJECT_CARD_NOT_IN_HAND');
  }

  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId);
  if (!jobCard) {
    return invalid('JOB_CARD_NOT_ON_TABLE');
  }

  // Matching cards use their own profession; assignedJobName is ignored.
  if (Object.keys(projectCard.requirements).includes(jobCard.name)) {
    return VALID;
  }

  // Mismatched card: only valid through 斜槓青年, and it must name a target position.
  if (!RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID)) {
    return invalid('PROJECT_JOB_NOT_REQUIRED', { jobName: jobCard.name });
  }
  if (!assignedJobName) {
    return invalid('PROFESSION_TARGET_REQUIRED');
  }
  if (!Object.keys(projectCard.requirements).includes(assignedJobName)) {
    return invalid('PROFESSION_TARGET_UNAVAILABLE');
  }

  return VALID;
};

export const validateRecruit = (
  G: ValidatableState,
  playerID: PlayerID,
  jobCardId: string,
  projectSlotId: string,
  assignedJobName?: string,
  opts?: SlotOptions,
): ValidationResult => {
  const base = validateSlotAndActionTokens(G, playerID, 'recruit', opts);
  if (!base.valid) return base;

  const requiredWorkers = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  const availableWorkers = PlayersSelector.getNumWorkerTokens(G.players, playerID);
  if (availableWorkers < requiredWorkers) {
    return invalid('INSUFFICIENT_WORKER_TOKENS', { required: requiredWorkers, available: availableWorkers });
  }

  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId);
  if (!jobCard) {
    return invalid('JOB_CARD_NOT_ON_TABLE');
  }

  const activeProject = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
  if (!activeProject || !activeProject.card) {
    return invalid('PROJECT_SLOT_NOT_FOUND');
  }

  // Matching cards use their own profession; assignedJobName is ignored.
  if (Object.keys(activeProject.card.requirements).includes(jobCard.name)) {
    if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, playerID)) {
      return invalid('WORKER_ALREADY_ASSIGNED', { jobName: jobCard.name });
    }
    const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobCard.name);
    if (jobContribution >= activeProject.card.requirements[jobCard.name]) {
      return invalid('JOB_REQUIREMENT_FULFILLED', { jobName: jobCard.name });
    }
    return VALID;
  }

  // Mismatched card: only valid through 斜槓青年, targeting a chosen position.
  if (!RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID)) {
    return invalid('PROJECT_JOB_NOT_REQUIRED', { jobName: jobCard.name });
  }
  if (!assignedJobName) {
    return invalid('PROFESSION_TARGET_REQUIRED');
  }
  if (!Object.keys(activeProject.card.requirements).includes(assignedJobName)) {
    return invalid('PROFESSION_TARGET_UNAVAILABLE');
  }
  // Per-player duplicate restriction applies to the TARGET profession.
  if (ProjectSlotSelector.hasWorker(activeProject, assignedJobName, playerID)) {
    return invalid('WORKER_ALREADY_ASSIGNED', { jobName: assignedJobName });
  }
  const targetContribution = ProjectSlotSelector.getJobContribution(activeProject, assignedJobName);
  if (targetContribution >= activeProject.card.requirements[assignedJobName]) {
    return invalid('JOB_REQUIREMENT_FULFILLED', { jobName: assignedJobName });
  }

  return VALID;
};

const validateContributions = (
  G: ValidatableState,
  playerID: PlayerID,
  actionName: 'contributeOwnedProjects' | 'contributeJoinedProjects',
  contributions: ContributionAction[],
  opts?: SlotOptions,
): ValidationResult => {
  const base = validateSlotAndActionTokens(G, playerID, actionName, opts);
  if (!base.valid) return base;

  if (contributions.length === 0) {
    return invalid('CONTRIBUTION_EMPTY');
  }

  for (const { projectSlotId, jobName } of contributions) {
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    if (!projectSlot || !projectSlot.card) {
      return invalid('PROJECT_SLOT_NOT_FOUND');
    }
    const projectOwner = ProjectSlotSelector.getOwner(projectSlot);
    if (actionName === 'contributeOwnedProjects' && projectOwner.owner !== playerID) {
      return invalid('PROJECT_NOT_OWNED');
    }
    if (actionName === 'contributeJoinedProjects' && projectOwner.owner === playerID) {
      return invalid('PROJECT_NOT_JOINED');
    }
    if (!ProjectSlotSelector.hasWorker(projectSlot, jobName, playerID)) {
      return invalid('NO_WORKER_ON_JOB', { jobName });
    }
  }

  const totalContributions = getTotalContributionValue(contributions);
  const limit = RuleSelector.getMaxContributionValue(G.rules, actionName);
  if (totalContributions > limit) {
    return invalid('CONTRIBUTION_EXCEEDS_LIMIT', { limit });
  }

  return VALID;
};

export const validateContributeOwnedProjects = (
  G: ValidatableState,
  playerID: PlayerID,
  contributions: ContributionAction[],
  opts?: SlotOptions,
): ValidationResult => validateContributions(G, playerID, 'contributeOwnedProjects', contributions, opts);

export const validateContributeJoinedProjects = (
  G: ValidatableState,
  playerID: PlayerID,
  contributions: ContributionAction[],
  opts?: SlotOptions,
): ValidationResult => validateContributions(G, playerID, 'contributeJoinedProjects', contributions, opts);

export const validateRemoveAndRefillJobs = (
  G: ValidatableState,
  playerID: PlayerID,
  jobCardIds: string[],
  opts?: SlotOptions,
): ValidationResult => {
  const base = validateSlotAndActionTokens(G, playerID, 'removeAndRefillJobs', opts);
  if (!base.valid) return base;

  if (jobCardIds.length === 0) {
    return invalid('NO_JOB_CARDS_SELECTED');
  }

  const jobCardsToRemove = JobSlotsSelector.getJobCardsByIds(G.table.jobSlots, jobCardIds);
  if (jobCardsToRemove.length !== jobCardIds.length) {
    return invalid('JOB_CARDS_NOT_ON_TABLE');
  }

  return VALID;
};

export const validateDiscardExcessJobCards = (
  G: ValidatableState,
  cardIds: string[],
): ValidationResult => {
  if (G.table.fourFreedomsPendingDiscards.length === 0) {
    return invalid('NO_PENDING_DISCARDS');
  }
  if (cardIds.length !== 2) {
    return invalid('DISCARD_COUNT_INVALID', { required: 2, selected: cardIds.length });
  }
  for (const id of cardIds) {
    if (!G.table.jobSlots.find((c) => c.id === id)) {
      return invalid('JOB_CARDS_NOT_ON_TABLE');
    }
  }
  return VALID;
};

/**
 * 加班 Overtime preconditions: the player still holds their per-turn token,
 * the target action is 1-AP-eligible, there is enough AP for the action's own
 * cost (the only AP charged), and the target's slot has already been used
 * this turn. Used by the UI to decide whether to offer redemption.
 */
export const validateOvertime = (
  G: ValidatableState,
  playerID: PlayerID,
  actionName: ActionMoveName,
): ValidationResult => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, actionName)) {
    return invalid('ACTION_UNAVAILABLE');
  }
  if (PlayersSelector.getNumOvertimeTokens(G.players, playerID) < 1) {
    return invalid('OVERTIME_UNAVAILABLE');
  }
  const cost = RuleSelector.getActionTokenCost(G.rules, actionName);
  if (cost > RuleSelector.getOvertimeMaxActionCost(G.rules)) {
    return invalid('OVERTIME_INELIGIBLE_ACTION', { cost });
  }
  const available = PlayersSelector.getNumActionTokens(G.players, playerID);
  if (available < cost) {
    return invalid('INSUFFICIENT_ACTION_TOKENS', { required: cost, available });
  }
  if (!ActionSlotSelector.isOccupied(G.table.actionSlots[actionName])) {
    return invalid('OVERTIME_TARGET_NOT_USED');
  }
  return VALID;
};
