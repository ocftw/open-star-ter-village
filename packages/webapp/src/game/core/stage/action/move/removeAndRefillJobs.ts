import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';

export type RemoveAndRefillJobs = (jobCardIds: string[]) => void;
export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G, playerID }, jobCardIds) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'removeAndRefillJobs')) {
    throw new Error('Action slot not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.removeAndRefillJobs)) {
    throw new Error('Action slot is occupied');
  }

  console.log('use action tokens')
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'removeAndRefillJobs');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    throw new Error('Not enough action tokens');
  }
  ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);

  console.log('remove job cards')
  // check job card is on the table
  const jobCardsToRemove = JobSlotsSelector.getJobCardsByIds(G.table.jobSlots, jobCardIds);
  if (jobCardsToRemove.length !== jobCardIds.length) {
    throw new Error('At least one job card not found');
  }

  // remove and discard job card
  JobSlotsMutator.removeJobCards(G.table.jobSlots, jobCardsToRemove);
  DeckMutator.discard(G.decks.jobs, jobCardsToRemove);

  console.log('refill job cards')
  // refill job cards
  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const filledJobSlots = JobSlotsSelector.getNumFilledSlots(G.table.jobSlots);
  const refillCardNumber = maxJobCards - filledJobSlots;
  const jobCardsToRefill = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsToRefill);

  console.log('score victory points')
  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'removeAndRefillJobs');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);
};
