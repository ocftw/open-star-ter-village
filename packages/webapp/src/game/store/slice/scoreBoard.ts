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

const ScoreBoardSlice = {
  initialState,
  mutators,
};

export const ScoreBoardMutator = ScoreBoardSlice.mutators;
export default ScoreBoardSlice;
