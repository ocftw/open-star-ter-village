import { GameHookHandler } from "../type";

/**
 * Prepare the next round's order in G. Standard then ends the round phase,
 * causing CUSTOM_FROM to adopt this order at the next phase's first turn.
 * Legacy Standard states omit options and retain their actual fixed order.
 */
export const passStartPlayerToken: GameHookHandler = ({ G }) => {
  if (G.standard) {
    const rotation = G.standard.options?.starterRotation ?? 'none';
    if (rotation === 'none') return;
    if (rotation === 'counterclockwise') {
      G.playOrder = G.playOrder.slice(-1).concat(G.playOrder.slice(0, -1));
      return;
    }
  }
  G.playOrder = G.playOrder.slice(1).concat(G.playOrder[0]);
};
