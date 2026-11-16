import { GameHookHandler } from "../type";

/**
 * Rotates the starting player clockwise by shifting G.playOrder.
 *
 * boardgame.io's ctx object is read-only inside hook functions — any mutation
 * to ctx (e.g. ctx.playOrder = ...) is silently discarded because the
 * framework reconstructs ctx from state.ctx after the hook returns, ignoring
 * the passed-in reference. See reducer-6f7cf6b0.js: `const G =
 * phaseConfig.turn.wrapped.onEnd(state)` followed by
 * `let ctx = { ...state.ctx, ... }`.
 *
 * The correct approach is to store the desired order in G.playOrder and
 * configure the turn with TurnOrder.CUSTOM_FROM('playOrder'). boardgame.io
 * reads it only when a phase begins, so the game ends its round phase after
 * this runs and the next round phase adopts the rotated order.
 */
export const passStartPlayerToken: GameHookHandler = ({ G }) => {
  G.playOrder = G.playOrder.slice(1).concat(G.playOrder[0]);
};
