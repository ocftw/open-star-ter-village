import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  export declare namespace Card {
    export type Base = { name: string };
    export type Project = Base & { jobs: string[] };
    export type Resource = Job | Force;
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
        resources: Deck<Card.Resource>;
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
      resources: Card.Resource[];
    }

    export interface Project {
      card: Card.Project;
      slots: number[];
      contributions: Record<string, number>;
    }
  }

  export declare namespace Move {
    export type CreateProject = (projectCardIndex: number, resourceCardIndex: number) => void;
    export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;
    export type Contribute = (contributions: { activeProjectIndex: number; slotIndex: number; value: number }[]) => void;
  }
}
