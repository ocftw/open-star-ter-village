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
import type { Ctx } from 'boardgame.io';

const isLastPlayerOfRound = (ctx: Pick<Ctx, 'playOrderPos' | 'numPlayers'>) =>
  ctx.playOrderPos === ctx.numPlayers - 1;

/**
 * The round is over once its last player's turn is ending: they ran out of AP
 * or pressed End Turn (endActionTurn/discardExcessJobCards set actionPhaseDone
 * for the last player instead of calling events.endTurn), and any 四大自由
 * discard is resolved. The phase endIf owns this so the last turn ends only
 * once, through EndPhase.
 */
const isRoundOver = (G: GameState, ctx: Ctx) =>
  isLastPlayerOfRound(ctx) &&
  G.table.fourFreedomsPendingDiscards.length === 0 &&
  (G.table.actionPhaseDone || PlayersSelector.getNumActionTokens(G.players, ctx.currentPlayer) === 0);

export const OpenStarTerVillage: Game<GameState, Record<string, unknown>, GameSetupData> = {
  name: 'OpenStarTerVillage',
  minPlayers: 2,
  maxPlayers: 4,
  // boardgame.io checks min/maxPlayers only on /create; this also covers playAgain
  // and socket sync, which passes a client's raw (possibly fractional) numPlayers.
  validateSetupData: (_setupData, numPlayers) =>
    Number.isInteger(numPlayers) && numPlayers >= 2 && numPlayers <= 4
      ? undefined
      : 'numPlayers must be 2 to 4',
  setup: setup,
  /**
   * One self-restarting phase per round. CUSTOM_FROM reads G.playOrder only
   * when a phase begins, so ending the phase after the last player's turn is
   * what makes passStartPlayerToken's rotation take effect. boardgame.io's
   * EndPhase runs that turn's onEnd (rotation included) before the next phase
   * reads G.playOrder.
   */
  phases: {
    round: {
      start: true,
      next: 'round',
      endIf: ({ G, ctx }) => isRoundOver(G, ctx),
    },
  },
  turn: {
    // Read at each round phase's start; ctx.playOrder is read-only in hooks.
    order: TurnOrder.CUSTOM_FROM('playOrder'),
    onBegin: (context) => {
      const { G, ctx } = context;
      // The final event queues endGame in onEnd. boardgame.io can begin the
      // next turn before that event flushes, when the event deck is empty.
      if (ctx.playOrderPos === 0 && G.decks.events.drawPile.length > 0) {
        playEventCard(context);
      }
    },
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
    },
    endIf: ({ G, ctx }) => {
      // The round phase ends the last player's turn (see isRoundOver).
      if (isLastPlayerOfRound(ctx)) return undefined;
      return PlayersSelector.getNumActionTokens(G.players, ctx.currentPlayer) === 0 || undefined;
    },
    onEnd: (context) => {
      const { ctx } = context;
      settleProjects(context);
      scoreLeftoverActionTokens(context);
      refill(context);
      if (isLastPlayerOfRound(ctx)) {
        removeEventCard(context);
        context.G.table.actionPhaseDone = false;

        passStartPlayerToken(context);
      }
    },
  },
  playerView,
};
