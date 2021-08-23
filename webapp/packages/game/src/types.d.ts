import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  export type ProjectCard = string;
  export type ResourceCard = string;
  export type JobCard = string;
  export type ForceCard = string;
  export type EventCard = string;

  export interface RootState {
    rules: RuleState;
    decks: {
      projects: IDeck<ProjectCard>;
      resources: IDeck<ResourceCard>;
      events: IDeck<EventCard>;
    };
    players: Record<PlayerID, PlayerState>;
  }

  export interface RuleState {
  }

  export interface PlayerState {
    hand: { projects: ProjectCard[]; resources: ResourceCard[]; };
    workerTokens: number;
    closedProjects: number;
  }
}

export interface IDeck<T> {
  draw: (n?: number) => T[];
  discard: (card: T | T[]) => void;
  shuffle: () => void;
}
