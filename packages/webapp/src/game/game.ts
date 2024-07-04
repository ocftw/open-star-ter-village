import { Game } from 'boardgame.io';
import { GameState } from './store/store';
import { setup } from './core/setup';
import { playerView } from './core/playerView';
import { action } from './core/stage/action/action';
import { settle } from './core/stage/settle/settle';
import { refill } from './core/stage/refill/refill';

export const OpenStarTerVillage: Game<GameState> = {
  setup: setup,
  turn: {
    onBegin: () => {
      // roundStart do something
      console.log('turn begin')
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
      settle,
      refill,
    },
    onEnd: () => { },
  },
  playerView,
};
