import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  type JobName = string;
  export declare namespace Card {
    export type Base = { name: string };
    export type Project = Base & {
      requirements: Record<JobName, number>;
    };
    export type Job = Base;
    export type Force = Base;
    export type Event = Base;
  }

  export declare namespace State {
    export interface Root {
      rules: Rule;
      decks: {
        projects: Deck<Card.Project>;
        jobs: Deck<Card.Job>;
        forces: Deck<Card.Force>;
        events: Deck<Card.Event>;
      };
      table: Table;
      players: Record<PlayerID, Player>;
    }

    export interface Rule {
    }

    export interface Deck<T> {
      drawPile: T[];
      discardPile: T[];
    }

    export interface Table {
      activeEvent: Card.Event | null;
      activeProjects: Project[];
      activeJobs: Card.Job[];
      activeMoves: Record<keyof Move.ActionMoves, boolean>;
    }

    export interface Player {
      hand: Hand;
      token: {
        workers: number;
        actions: number;
      };
      completed: {
        projects: Card.Project[];
      };
      victoryPoints: number;
    }

    export interface Hand {
      projects: Card.Project[];
      forces: Card.Force[];
    }

    export interface Project {
      card: Card.Project;
      owner: PlayerID;
      contributions: { jobName: JobName; worker: PlayerID; value: number }[];
    }
  }

  export declare namespace Move {
    export type AllMoves = ActionMoves & StageMoves;
    export interface ActionMoves {
      createProject: CreateProject;
      recruit: Recruit;
      contributeOwnedProjects: ContributeOwnedProjects;
      contributeJoinedProjects: ContributeJoinedProjects;
      removeAndRefillJobs: RemoveAndRefillJobs;
      mirror: Mirror;
    };
    export interface StageMoves {
      settle: Settle;
      refillAndEnd: RefillAndEnd;
    };

    export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;
    export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;
    export type ContributeOwnedProjects = (contributions: { activeProjectIndex: number; jobName: JobName; value: number }[]) => void;
    export type ContributeJoinedProjects = (contributions: { activeProjectIndex: number; jobName: JobName; value: number }[]) => void;
    export type RemoveAndRefillJobs = (jobCardIndices: number[]) => void;
    export type Mirror = (actionName: keyof ActionMoves, ...params: any[]) => void;
    export type Settle = () => void;
    export type RefillAndEnd = () => void;
    export type RefillProject = () => void;
    export type RefillForce = () => void;
  }
}
