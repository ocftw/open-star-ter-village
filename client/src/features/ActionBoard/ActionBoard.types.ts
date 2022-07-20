import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

export type MoveType = keyof Type.Move.AllMoves;

export enum MoveStatus {
  'editing',
  'submitted',
}

export interface Move {
  move: MoveType;
  status: MoveStatus;
  selections: {
    tableProject: boolean[];
    tableJobs: boolean[];
    handProjects: boolean[];
    handForces: boolean[];
  };
}
