import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { discardJobCards, refillJobSlots } from '@/game/core/slashWildJob';
import { ActionExecutionOptions, ActionValidationError, resolveJobAssignment, validateCreateProject } from '@/game/core/stage/action/validate';
import { applyActionCost } from './applyActionCost';

export type CreateProject = (
  projectCardId: string,
  jobCardId: string,
  assignedJobName?: string,
  options?: ActionExecutionOptions,
) => void;

export const createProject: GameMove<CreateProject> = ({ G, ctx, playerID }, projectCardId, jobCardId, assignedJobName, options) => {
  // Shared validation: same predicates the client preflight runs. Whether
  // assignedJobName may override the requirement is derived from
  // authoritative event state inside the validator.
  const result = validateCreateProject(G, playerID, projectCardId, jobCardId, assignedJobName, options, ctx.currentPlayer);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  const projectCard = PlayersSelector.getProjectCardById(G.players, playerID, projectCardId)!;
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId)!;
  const assignment = resolveJobAssignment(
    G, playerID, ctx.currentPlayer, jobCard, Object.keys(projectCard.requirements), assignedJobName,
  );
  if (!assignment.valid) {
    throw new ActionValidationError(assignment);
  }

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'createProject', options);
  PlayersMutator.useWorkerTokens(G.players, playerID, projectOwnerWorkerTokenCosts);

  PlayersMutator.useProject(G.players, playerID, projectCard);
  ProjectBoardMutator.add(G.table.projectBoard, projectCard);

  const projectSlot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, projectCard);
  ProjectSlotMutator.assignOwner(projectSlot, playerID, projectOwnerWorkerTokenCosts);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  // The synthetic 斜槓青年 wild card never enters the discard pile.
  discardJobCards(G, [jobCard]);

  if (assignment.consumesEntitlement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'createProject');
  // 斜槓青年: the wild card (or a legacy override) records its contribution
  // under the player-chosen required position, never under its own name.
  ProjectSlotMutator.assignWorker(projectSlot, assignment.jobName, playerID, initialContributionValue);

  // Refill job card (counts real cards only; the wild card is not a market slot)
  refillJobSlots(G);

  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'createProject');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

};
