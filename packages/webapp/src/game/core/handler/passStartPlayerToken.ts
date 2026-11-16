import { GameHookHandler } from "../type";

/**
 * Optionally rotates the starting player by shifting G.playOrder, in the
 * direction given by G.starterRotation ('none' leaves the order untouched).
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
 * this runs and the next round phase adopts G.playOrder (rotated or not).
 */
export const passStartPlayerToken: GameHookHandler = ({ G }) => {
  const rotation = G.starterRotation ?? 'none';
  if (rotation === 'counterclockwise') {
    G.playOrder = G.playOrder.slice(-1).concat(G.playOrder.slice(0, -1));
  } else if (rotation === 'clockwise') {
    G.playOrder = G.playOrder.slice(1).concat(G.playOrder[0]);
  }
  // 'none' (or any unrecognized value) keeps G.playOrder as is.
};
