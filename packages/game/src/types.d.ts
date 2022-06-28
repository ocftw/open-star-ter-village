import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  type JobName = string;
  export declare namespace Card {
    export type Base = { name: string };
    export type Project = Base & { jobs: JobName[], thresholds: Record<JobName, number> };
    export type Job = Base;
    export type Force = Base;
    export type Event = Base;
    export type Goal = Base;
  }

  export declare namespace State {
    export interface Root {
      rules: Rule;
      decks: {
        projects: Deck<Card.Project>;
        jobs: Deck<Card.Job>;
        forces: Deck<Card.Force>;
        events: Deck<Card.Event>;
        goals: Deck<Card.Goal>;
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
    }

    export interface Hand {
      projects: Card.Project[];
      jobs: Card.Job[];
      forces: Card.Force[];
    }

    export interface Project {
      card: Card.Project;
      owner: PlayerID;
      workers: (PlayerID | null)[];
      contribution: {
        bySlot: number[];
        byJob: Record<string, number>;
      };
    }
  }

  export declare namespace Move {
    export interface Moves {
      createProject: CreateProject;
      recruit: Recruit;
      contribute: Contribute;
      settle: Settle;
      refillAndEnd: RefillAndEnd;
    };
    export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;
    export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;
    export type Contribute = (contributions: { activeProjectIndex: number; slotIndex: number; value: number }[]) => void;
    export type Settle = () => void;
    export type RefillAndEnd = () => void;
  }
}
