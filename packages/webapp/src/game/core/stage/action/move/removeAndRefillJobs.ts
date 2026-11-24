import { discardJobCards, refillJobSlots } from '@/game/core/slashWildJob';
import { GameMove } from '@/game/core/type';
import { RuleSelector } from '@/game/store/slice/rule';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { ActionExecutionOptions, ActionValidationError, validateRemoveAndRefillJobs } from '@/game/core/stage/action/validate';
import { applyActionCost } from './applyActionCost';

export type RemoveAndRefillJobs = (jobCardIds: string[], options?: ActionExecutionOptions) => void;
export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G, playerID }, jobCardIds, options) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateRemoveAndRefillJobs(G, playerID, jobCardIds, options);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const jobCardsToRemove = JobSlotsSelector.getJobCardsByIds(G.table.jobSlots, jobCardIds);

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'removeAndRefillJobs', options);

  // remove and discard job card
  JobSlotsMutator.removeJobCards(G.table.jobSlots, jobCardsToRemove);
  discardJobCards(G, jobCardsToRemove);

  // refill job cards up to maxJobSlots real cards
  refillJobSlots(G);

  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'removeAndRefillJobs');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);
};
