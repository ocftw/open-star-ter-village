import { PlayerID } from "boardgame.io";


export type ScoreBoard = Record<PlayerID, number>;
const initialState = (): ScoreBoard => ({});
const mutators = {
  initialize: (state: ScoreBoard, playerNames: PlayerID[]): void => {
    playerNames.forEach(player => {
      state[player] = 0;
    });
  },
  add: (state: ScoreBoard, playerId: PlayerID, points: number): void => {
    state[playerId] += points;
  },
};

const selectors = {
  getPlayerPoints: (state: ScoreBoard, playerId: PlayerID): number => {
    return state[playerId];
  },
  getWinner: (state: ScoreBoard): PlayerID => {
    let winner: PlayerID = '';
    let maxPoints = -Infinity;
    Object.entries(state).forEach(([playerId, points]) => {
      if (points > maxPoints) {
        maxPoints = points;
        winner = playerId;
      }
    });
    return winner;
  },
};

const ScoreBoardSlice = {
  initialState,
  selectors,
  mutators,
};

export const ScoreBoardMutator = ScoreBoardSlice.mutators;
export const ScoreBoardSelector = ScoreBoardSlice.selectors;
export default ScoreBoardSlice;
