import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

export type MoveType = keyof Type.Move.AllMoves;

export interface Move {
  move: MoveType;
  selections: {
    tableProject: boolean[];
    tableJobs: boolean[];
    handProjects: boolean[];
    handForces: boolean[];
  };
}
