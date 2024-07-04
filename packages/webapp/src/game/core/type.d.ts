import { FnContext, PlayerID, StageConfig } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { JobName } from '../card';
import { GameState } from '../store/store';
import { CreateProject } from './stage/action/move/createProject';
import { Mirror } from './stage/action/move/mirror';
import { RemoveAndRefillJobs } from './stage/action/move/removeAndRefillJobs';
import { ContributeJoinedProjects } from './stage/action/move/contributeJoinedProjects';
import { ContributeOwnedProjects } from './stage/action/move/contributeOwnedProjects';
import { Recruit } from './stage/action/move/recruit';
import { ActionMoves, ActionMoveName } from './stage/action/move/type';
import { SettleMoveNames, SettleMoves } from './stage/settle/move/type';
import { RefillMoveNames, RefillMoves } from './stage/refill/move/type';

export type AllMoves = ActionMoves & SettleMoves & RefillMoves;
export type AllMoveNames = ActionMoveName | SettleMoveNames | RefillMoveNames;

export interface ContributionAction {
  jobName: JobName;
  value: number;
  activeProjectIndex: number;
}

// Define the type of a move to support type checking
export type GameMove<Fn extends (...params: any[]) => void> = (context: FnContext<GameState> & { playerID: PlayerID }, ...args: Parameters<Fn>) => void | GameState | typeof INVALID_MOVE;

export type GameStageConfig = StageConfig<GameState>;
