import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  export type ProjectCard = string;
  export type ResourceCard = string;
  export type JobCard = string;
  export type ForceCard = string;
  export type EventCard = string;

  export declare namespace State {
    export interface Root {
      rules: Rule;
      decks: {
        projects: Deck<ProjectCard>;
        resources: Deck<ResourceCard>;
        events: Deck<EventCard>;
      };
      table: TableState;
      players: Record<PlayerID, Player>;
    }

    export interface Rule {
    }

    export interface Deck<T> {
      pile: T[];
      discardPile: T[];
    }

    export interface Player {
      hand: { projects: ProjectCard[]; resources: ResourceCard[]; };
      workerTokens: number;
      closedProjects: number;
    }
  }
}
