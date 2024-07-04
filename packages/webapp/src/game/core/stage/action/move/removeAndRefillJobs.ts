import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { GameMove } from '@/game/core/type';
import { CardsMutator } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';

export type RemoveAndRefillJobs = (jobCardIndices: number[]) => void;
export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G }, jobCardIndices) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.removeAndRefillJobs)) {
    return INVALID_MOVE;
  }

  const currentJob = G.table.jobSlots;
  const jobDeck = G.decks.jobs;
  const isInvalid = jobCardIndices.map(index => !isInRange(index, currentJob.length)).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const removedJobCards = jobCardIndices.map(index => currentJob[index]);
  CardsMutator.remove(currentJob, removedJobCards);
  DeckMutator.discard(jobDeck, removedJobCards);

  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJob.length;
  const jobCards = DeckSelector.peek(jobDeck, refillCardNumber);
  DeckMutator.draw(jobDeck, refillCardNumber);
  CardsMutator.add(currentJob, jobCards);

  ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);
};
