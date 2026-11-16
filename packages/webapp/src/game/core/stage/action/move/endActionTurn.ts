import { GameMove } from '@/game/core/type';

export type EndActionTurn = () => void;

/**
 * Ends the current player's action turn.
 *
 * The last player in a round only sets G.table.actionPhaseDone = true: the
 * round phase's endIf then ends their turn and the round together, or waits
 * while 四大自由 (add_two_worker_slots) discards are pending until
 * discardExcessJobCards resolves them.
 */
export const endActionTurn: GameMove<EndActionTurn> = ({ G, ctx, events }) => {
  if (ctx.playOrderPos === ctx.numPlayers - 1) {
    G.table.actionPhaseDone = true;
    return;
  }
  events.endTurn();
};
