import { JobCard } from '@/game/card';
import { GameMove } from '@/game/core/type';
import { DeckMutator } from '@/game/store/slice/deck';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';

export type DiscardExcessJobCards = (cardIds: string[]) => void;

/**
 * Last-player move for 四大自由 (add_two_worker_slots): select exactly 2 job cards from
 * the table to discard, then end the turn.
 *
 * Validation:
 *   - Exactly 2 card IDs must be provided.
 *   - Both IDs must correspond to cards currently on the table.
 */
export const discardExcessJobCards: GameMove<DiscardExcessJobCards> = ({ G, events }, cardIds) => {
  if (G.table.fourFreedomsPendingDiscards.length === 0) {
    throw new Error('No pending discards');
  }
  if (cardIds.length !== 2) {
    throw new Error('Must select exactly 2 job cards to discard');
  }

  const cardsToDiscard: JobCard[] = [];
  for (const id of cardIds) {
    const card = G.table.jobSlots.find(c => c.id === id);
    if (!card) throw new Error(`Job card ${id} not found on table`);
    cardsToDiscard.push(card);
  }

  JobSlotsMutator.removeJobCards(G.table.jobSlots, cardsToDiscard);
  DeckMutator.discard(G.decks.jobs, cardsToDiscard);
  G.table.fourFreedomsPendingDiscards = [];
  G.table.actionPhaseDone = false;
  events.endTurn();
};
