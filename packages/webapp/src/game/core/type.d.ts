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

export type AllMoves = ActionMoves;
export type AllMoveNames = ActionMoveName;

export interface ContributionAction {
  jobName: JobName;
  value: number;
  activeProjectIndex: number;
}

// Define the type of a move to support type checking
export type GameMove<Fn extends (...params: any[]) => void> = (context: FnContext<GameState> & { playerID: PlayerID }, ...args: Parameters<Fn>) => void | GameState | typeof INVALID_MOVE;

// Define the type of a hook to support type checking
export type GameHookHandler = (context: FnContext<GameState>) => void | GameState;

export type GameStageConfig = StageConfig<GameState>;
