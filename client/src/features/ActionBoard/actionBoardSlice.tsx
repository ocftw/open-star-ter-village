import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { PlayerID } from 'boardgame.io';
import { MoveStatus, MoveType, Move } from './ActionBoard.types';

export interface ActionBoardState {
  currentPlayer: PlayerID | null;
  moves: Move[];
}

const initialState: ActionBoardState = {
  currentPlayer: null,
  moves: []
}

export const ActionBoardSlice = createSlice({
  name: 'actionBoard',
  initialState,
  reducers: {
    playerTurnInited: (state, action: PayloadAction<PlayerID>) => {
      const playerId = action.payload;

      state.currentPlayer = playerId;
      state.moves = [];
    },
    moveInited: (state, action: PayloadAction<{ moveType: MoveType }>) => {
      const { moveType } = action.payload;

      state.moves.push({
        move: moveType,
        status: MoveStatus.editing,
        selections: {
          tableProject: [],
          tableJobs: [],
          handProjects: [],
          handForces: [],
        }
      });
    },
    tableProjectToggled: (state, action: PayloadAction<{ moveIndex: number, tableProjectIndex: number }>) => {
      const { moveIndex, tableProjectIndex } = action.payload;

      state.moves[moveIndex].status = MoveStatus.editing;
      state.moves[moveIndex].selections.tableProject[tableProjectIndex] =
        !state.moves[moveIndex].selections.tableProject[tableProjectIndex];
    },
    tableJobsToggled: (state, action: PayloadAction<{ moveIndex: number, tableJobsIndex: number }>) => {
      const { moveIndex, tableJobsIndex } = action.payload;

      state.moves[moveIndex].status = MoveStatus.editing;
      state.moves[moveIndex].selections.tableJobs[tableJobsIndex] =
        !state.moves[moveIndex].selections.tableJobs[tableJobsIndex];
    },
    handProjectsToggled: (state, action: PayloadAction<{ moveIndex: number, handProjectsIndex: number }>) => {
      const { moveIndex, handProjectsIndex } = action.payload;

      state.moves[moveIndex].status = MoveStatus.editing;
      state.moves[moveIndex].selections.handProjects[handProjectsIndex] =
        !state.moves[moveIndex].selections.handProjects[handProjectsIndex];
    },
    handForcesToggled: (state, action: PayloadAction<{ moveIndex: number, handForcesIndex: number }>) => {
      const { moveIndex, handForcesIndex } = action.payload;

      state.moves[moveIndex].status = MoveStatus.editing;
      state.moves[moveIndex].selections.handForces[handForcesIndex] =
        !state.moves[moveIndex].selections.handForces[handForcesIndex];
    },
    moveSubmitted: (state, action: PayloadAction<{ moveIndex: number }>) => {
      const { moveIndex } = action.payload;
      // TODO: call api
      state.moves[moveIndex].status = MoveStatus.submitted;
    }
  }
})

export const {
  playerTurnInited,
  moveInited,
  tableProjectToggled,
  tableJobsToggled,
  handForcesToggled,
} = ActionBoardSlice.actions

export default ActionBoardSlice.reducer
