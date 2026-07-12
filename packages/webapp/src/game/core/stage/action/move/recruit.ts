import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ActionValidationError, validateRecruit } from '@/game/core/stage/action/validate';

export type Recruit = (jobCardId: string, projectSlotId: string) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardId, projectSlotId) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateRecruit(G, playerID, jobCardId, projectSlotId);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'recruit');
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId)!;
  const activeProject = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId)!;
  const ignoreRequirement = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.recruit);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  if (ignoreRequirement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);

  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);
};
