import { GameMove } from '@/game/core/type';

export type EndActionTurn = () => void;

/**
 * Ends the current player's action turn.
 *
 * For the last player in a round while 四大自由 (add_two_worker_slots) is active,
 * calling this sets G.table.actionPhaseDone = true instead of ending the turn immediately.
 * The turn stays open until the player selects 2 job cards to discard via
 * discardExcessJobCards, which then calls events.endTurn().
 */
export const endActionTurn: GameMove<EndActionTurn> = ({ G, ctx, events }) => {
  const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
  if (isLastPlayer && G.table.fourFreedomsPendingDiscards.length > 0) {
    G.table.actionPhaseDone = true;
    return;
  }
  events.endTurn();
};
