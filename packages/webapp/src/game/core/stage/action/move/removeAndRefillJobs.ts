import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ActionValidationError, validateRemoveAndRefillJobs } from '@/game/core/stage/action/validate';

export type RemoveAndRefillJobs = (jobCardIds: string[]) => void;
export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G, playerID }, jobCardIds) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateRemoveAndRefillJobs(G, playerID, jobCardIds);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'removeAndRefillJobs');
  const jobCardsToRemove = JobSlotsSelector.getJobCardsByIds(G.table.jobSlots, jobCardIds);

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);

  // remove and discard job card
  JobSlotsMutator.removeJobCards(G.table.jobSlots, jobCardsToRemove);
  DeckMutator.discard(G.decks.jobs, jobCardsToRemove);

  // refill job cards
  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const filledJobSlots = JobSlotsSelector.getNumFilledSlots(G.table.jobSlots);
  const refillCardNumber = maxJobCards - filledJobSlots;
  const jobCardsToRefill = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsToRefill);

  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'removeAndRefillJobs');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);
};
