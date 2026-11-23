import { PlayerID } from 'boardgame.io';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { JobCard } from '@/game/card';
import {
  canPlaySlashWildJobCard,
  isSlashWildJobCard,
} from '@/game/core/slashWildJob';
import { ActionExecutionOptions, invalid, VALID, ValidatableState, ValidationFailure, ValidationResult } from './types';

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
  if (opts?.useOvertime) {
    const overtime = validateOvertime(G, playerID, actionName);
    if (!overtime.valid) return overtime;
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

/** How a job card is placed onto a project, once validated. */
export type JobAssignment = {
  valid: true;
  /** Profession the contribution is recorded under. */
  jobName: string;
  /** Marked games: the synthetic wild card (removed, never discarded). */
  wild: boolean;
  /** Whether placing this card spends the player's 斜槓青年 entitlement. */
  consumesEntitlement: boolean;
};

/**
 * Resolve which profession `jobCard` fills on a project requiring
 * `requirementNames`. Shared by validators and moves.
 *
 * Marked games (Rule.slashWildJobCard): only the player's own synthetic wild
 * card is wild; it needs an assignedJobName among the requirements and is the
 * only thing that consumes the entitlement. An ordinary card must match.
 * Legacy games: a mismatched ordinary card is accepted through the entitlement
 * with an assignedJobName, and the first placement consumes it even when matching.
 */
export const resolveJobAssignment = (
  G: ValidatableState,
  playerID: PlayerID,
  jobCard: JobCard,
  requirementNames: string[],
  assignedJobName?: string,
): JobAssignment | ValidationFailure => {
  const entitled = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);

  if (RuleSelector.isSlashWildJobCardEnabled(G.rules)) {
    if (isSlashWildJobCard(jobCard)) {
      // Someone else's / spent wild card is not playable: treat as gone.
      if (!canPlaySlashWildJobCard(G.rules, playerID, jobCard)) {
        return invalid('JOB_CARD_NOT_ON_TABLE');
      }
      if (!assignedJobName) {
        return invalid('PROFESSION_TARGET_REQUIRED');
      }
      if (!requirementNames.includes(assignedJobName)) {
        return invalid('PROFESSION_TARGET_UNAVAILABLE');
      }
      return { valid: true, jobName: assignedJobName, wild: true, consumesEntitlement: true };
    }
    if (!requirementNames.includes(jobCard.name)) {
      return invalid('PROJECT_JOB_NOT_REQUIRED', { jobName: jobCard.name });
    }
    return { valid: true, jobName: jobCard.name, wild: false, consumesEntitlement: false };
  }

  // Legacy (unmarked) game. A synthetic card can only be stray state here.
  if (isSlashWildJobCard(jobCard)) {
    return invalid('JOB_CARD_NOT_ON_TABLE');
  }
  // Matching cards use their own profession; assignedJobName is ignored.
  if (requirementNames.includes(jobCard.name)) {
    return { valid: true, jobName: jobCard.name, wild: false, consumesEntitlement: entitled };
  }
  if (!entitled) {
    return invalid('PROJECT_JOB_NOT_REQUIRED', { jobName: jobCard.name });
  }
  if (!assignedJobName) {
    return invalid('PROFESSION_TARGET_REQUIRED');
  }
  if (!requirementNames.includes(assignedJobName)) {
    return invalid('PROFESSION_TARGET_UNAVAILABLE');
  }
  return { valid: true, jobName: assignedJobName, wild: false, consumesEntitlement: true };
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

  const assignment = resolveJobAssignment(
    G, playerID, jobCard, Object.keys(projectCard.requirements), assignedJobName,
  );
  if (!assignment.valid) return assignment;

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

  const assignment = resolveJobAssignment(
    G, playerID, jobCard, Object.keys(activeProject.card.requirements), assignedJobName,
  );
  if (!assignment.valid) return assignment;
  // Per-player duplicate / fulfilled checks apply to the profession actually filled
  // (the card's own, or the wild card's / legacy override's chosen target).
  const { jobName } = assignment;
  if (ProjectSlotSelector.hasWorker(activeProject, jobName, playerID)) {
    return invalid('WORKER_ALREADY_ASSIGNED', { jobName });
  }
  const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobName);
  if (jobContribution >= activeProject.card.requirements[jobName]) {
    return invalid('JOB_REQUIREMENT_FULFILLED', { jobName });
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
  if (jobCardsToRemove.some(isSlashWildJobCard)) {
    return invalid('SLASH_WILD_JOB_NOT_REMOVABLE');
  }
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
    const card = G.table.jobSlots.find((c) => c.id === id);
    if (card && isSlashWildJobCard(card)) {
      return invalid('SLASH_WILD_JOB_NOT_REMOVABLE');
    }
    if (!card) {
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
