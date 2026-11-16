import { GameMove } from '@/game/core/type';
import { DeckMutator } from '@/game/store/slice/deck';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { ActionValidationError, validateDiscardExcessJobCards } from '@/game/core/stage/action/validate';

export type DiscardExcessJobCards = (cardIds: string[]) => void;

/**
 * Last-player move for 四大自由 (add_two_worker_slots): select exactly 2 job cards from
 * the table to discard, then end the turn. For the last player the round phase's
 * endIf ends the turn (and the round) once actionPhaseDone is set.
 */
export const discardExcessJobCards: GameMove<DiscardExcessJobCards> = ({ G, ctx, events }, cardIds) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateDiscardExcessJobCards(G, cardIds);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const cardsToDiscard = cardIds.map((id) => G.table.jobSlots.find((c) => c.id === id)!);

  JobSlotsMutator.removeJobCards(G.table.jobSlots, cardsToDiscard);
  DeckMutator.discard(G.decks.jobs, cardsToDiscard);
  G.table.fourFreedomsPendingDiscards = [];
  if (ctx.playOrderPos === ctx.numPlayers - 1) {
    G.table.actionPhaseDone = true;
    return;
  }
  events.endTurn();
};
