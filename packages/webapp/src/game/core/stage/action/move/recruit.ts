import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { discardJobCards, refillJobSlots } from '@/game/core/slashWildJob';
import { ActionExecutionOptions, ActionValidationError, resolveJobAssignment, validateRecruit } from '@/game/core/stage/action/validate';
import { applyActionCost } from './applyActionCost';

export type Recruit = (
  jobCardId: string,
  projectSlotId: string,
  assignedJobName?: string,
  options?: ActionExecutionOptions,
) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardId, projectSlotId, assignedJobName, options) => {
  // Shared validation: same predicates the client preflight runs. Whether
  // assignedJobName may override the requirement is derived from
  // authoritative event state inside the validator.
  const result = validateRecruit(G, playerID, jobCardId, projectSlotId, assignedJobName, options);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId)!;
  const activeProject = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId)!;
  const assignment = resolveJobAssignment(
    G, playerID, jobCard, Object.keys(activeProject.card!.requirements), assignedJobName,
  );
  if (!assignment.valid) {
    throw new ActionValidationError(assignment);
  }

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'recruit', options);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  // The synthetic 斜槓青年 wild card never enters the discard pile.
  discardJobCards(G, [jobCard]);

  if (assignment.consumesEntitlement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);

  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  // 斜槓青年: the wild card (or a legacy override) records its contribution
  // under the player-chosen required position, never under its own name.
  ProjectSlotMutator.assignWorker(activeProject, assignment.jobName, playerID, initialContributionValue);

  // Refill job card (counts real cards only; the wild card is not a market slot)
  refillJobSlots(G);
};
