import { FnContext, PlayerID } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { JobName } from '../card';
import { GameState } from '../store/store';
import { CreateProject } from './createProject';
import { Mirror } from './mirror';
import { RemoveAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects } from './contributeJoinedProjects';
import { ContributeOwnedProjects } from './contributeOwnedProjects';
import { Recruit } from './recruit';

export type AllMoves = ActionMoves & StageMoves;
export type AllMoveNames = keyof AllMoves;

export interface ActionMoves {
  createProject: CreateProject;
  recruit: Recruit;
  contributeOwnedProjects: ContributeOwnedProjects;
  contributeJoinedProjects: ContributeJoinedProjects;
  removeAndRefillJobs: RemoveAndRefillJobs;
  mirror: Mirror;
};
export type ActionMove = keyof ActionMoves;

export interface StageMoves {
  settle: Settle;
  refillAndEnd: RefillAndEnd;
};
export type StageMoveNames = keyof StageMoves;

export type Contribution = { jobName: JobName; value: number }
export interface ContributionAction extends Contribution {
  activeProjectIndex: number;
}

export type Settle = () => void;
export type RefillAndEnd = () => void;
export type RefillProject = () => void;
export type RefillForce = () => void;

// Define the type of a move to support type checking
export type GameMove<Fn extends (...params: any[]) => void> = (context: FnContext<GameState> & { playerID: PlayerID }, ...args: Parameters<Fn>) => void | GameState | typeof INVALID_MOVE;
