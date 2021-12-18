import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  export declare namespace Card {
    export type Project = string;
    export type Resource = Job | Force;
    export type Job = string;
    export type Force = string;
    export type Event = string;
  }

  export declare namespace State {
    export interface Root {
      rules: Rule;
      decks: {
        projects: Deck<Card.Project>;
        resources: Deck<Card.Resource>;
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
    }

    export interface Player {
      hand: Hand;
      token: {
        workers: number;
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
    }
  }
}
