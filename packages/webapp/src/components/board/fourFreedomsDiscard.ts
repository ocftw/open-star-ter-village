import { Ctx } from 'boardgame.io';
import { ClientGameState } from '@/game';

/**
 * 四大自由: true while the round is blocked on the last player removing 2 job
 * cards — they are on turn, cards are still pending, and their action phase is
 * over (AP exhausted or endActionTurn already called). Uses the current
 * player's tokens so every viewer computes the same answer.
 */
export const isFourFreedomsDiscardPending = (
  G: ClientGameState,
  ctx: Pick<Ctx, 'currentPlayer' | 'playOrderPos' | 'numPlayers'>,
): boolean => {
  const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
  if (!isLastPlayer || G.table.fourFreedomsPendingDiscards.length === 0) return false;
  const outOfAP = (G.players[ctx.currentPlayer]?.token?.actions ?? 1) === 0;
  return outOfAP || G.table.actionPhaseDone;
};
