import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ActionExecutionOptions, ActionValidationError, validateRecruit } from '@/game/core/stage/action/validate';
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
  const ignoreRequirement = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'recruit', options);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  if (ignoreRequirement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);

  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  // 斜槓青年: a mismatched card records its contribution under the
  // player-chosen required position, never under an unrequired profession.
  const matchesRequirement = Object.keys(activeProject.card!.requirements).includes(jobCard.name);
  const effectiveJobName = matchesRequirement ? jobCard.name : assignedJobName!;
  ProjectSlotMutator.assignWorker(activeProject, effectiveJobName, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);
};
