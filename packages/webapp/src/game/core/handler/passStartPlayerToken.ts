import { GameHookHandler } from "../type";

export const passStartPlayerToken: GameHookHandler = ({ ctx }) => {
  console.log('pass start player token to next player');
  ctx.playOrder = ctx.playOrder.slice(1).concat(ctx.playOrder[0]);
};
