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
  phases: { round: {
    start: true, next: 'round',
    endIf: ({ G, ctx }) => G.standard?.phase === 'ready' && ctx.playOrderPos === ctx.numPlayers - 1,
  } },
  turn: {
    // CUSTOM_FROM is read at phase entry. Standard ends the phase each round
    // so the engine adopts the next round's order without mutating ctx.
    order: TurnOrder.CUSTOM_FROM('playOrder'),
    onBegin: (context) => {
      const { G, ctx } = context;
      // The final event queues endGame in onEnd. boardgame.io can begin the
      // next turn before that event flushes, when the event deck is empty.
      if (G.standard && G.decks.events.drawPile.length === 0 && !G.table.eventSlot) return;
      if (ctx.playOrderPos === 0 && G.decks.events.drawPile.length > 0) {
        playEventCard(context);
        beginStandardEvent(G);
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
