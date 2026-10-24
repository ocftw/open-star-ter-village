import { advanceStandard, beginStandardEvent, resetStandardTurn, resolveStandardChoice } from './standard/engine';
import { roomSetupError } from './standard/config';
import { Game } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';
import { GameState } from './store/store';
import { setup, GameSetupData } from './core/setup';
import { playerView } from './core/playerView';
import { action } from './core/stage/action/action';
import { playEventCard } from './core/handler/playEventCard';
import { removeEventCard } from './core/handler/removeEventCard';
import { passStartPlayerToken } from './core/handler/passStartPlayerToken';
import { PlayersSelector } from './store/slice/players';
import { settleProjects } from './core/handler/settleProjects';
import { scoreLeftoverActionTokens } from './core/handler/scoreLeftoverActionTokens';
import { refill } from './core/handler/refill';

export const OpenStarTerVillage: Game<GameState, Record<string, unknown>, GameSetupData> = {
  name: 'OpenStarTerVillage',
  minPlayers: 2,
  maxPlayers: 6,
  setup: setup,
  validateSetupData: (data, numPlayers) => roomSetupError(data, numPlayers),
  turn: {
    /**
     * Use CUSTOM_FROM so boardgame.io re-reads G.playOrder at the start of
     * each turn. This lets passStartPlayerToken rotate the starting player by
     * mutating G.playOrder (which is safe) rather than ctx.playOrder (which
     * is read-only in hooks and would be silently ignored).
     */
    order: TurnOrder.CUSTOM_FROM('playOrder'),
    onBegin: (context) => {
      const { ctx } = context;
      // endGame queued by the last event flushes after onEnd; do not draw past it.
      if (context.G.standard && context.G.decks.events.drawPile.length === 0 && !context.G.table.eventSlot) return;
      if (ctx.playOrderPos === 0) {
        playEventCard(context);
        beginStandardEvent(context.G);
      }
      advanceStandard(context);
    },
    onMove: advanceStandard,
    /**
     * send current player to action stage.
     * Do not set maxMoves as action points because following reasons
     *  1. Max moves capped all stage moves. i.e. 3 maxMoves means sum(moves in action/settle/discards/refill) <= 3
     *  2. Each move costs one and no dynamic cost can be set. i.e. createProject should cost `2` action points
     *  3. maxMoves cannot update after game starts. i.e. maxMoves cannot change when user has more than 3 action points
     * Solution: validate them in each move. return INVALID_MOVE when action points is not enough
     */
    activePlayers: {
      currentPlayer: {
        stage: 'action',
      },
    },
    stages: {
      action,
      standardChoice: { moves: { resolveStandardChoice: { client: false, move: resolveStandardChoice } } },
    },
    endIf: ({ G, ctx }) => {
      if (G.standard) return G.standard.phase === 'ready' ? true : undefined;
      const outOfAP = PlayersSelector.getNumActionTokens(G.players, ctx.currentPlayer) === 0;
      if (!outOfAP) return undefined;
      // Last player must discard 2 job cards (四大自由) before the turn can end.
      const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
      if (isLastPlayer && G.table.fourFreedomsPendingDiscards.length > 0) return undefined;
      return true;
    },
    onEnd: (context) => {
      const { ctx } = context;
      if (!context.G.standard) settleProjects(context);
      scoreLeftoverActionTokens(context);
      if (context.G.standard) resetStandardTurn(context.G, ctx.currentPlayer);
      else refill(context);
      if (ctx.playOrderPos === ctx.numPlayers - 1) {
        if (context.G.standard && context.G.table.eventSlot?.type === 'last_round') context.G.standard.finishedAt = Date.now();
        removeEventCard(context);

        passStartPlayerToken(context);
      }
    },
  },
  playerView,
};
