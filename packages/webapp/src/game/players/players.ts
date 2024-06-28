import { PlayerID } from "boardgame.io";
import { ForceCard, ProjectCard } from "../cards/card";

export interface Hand {
  projects: ProjectCard[];
  forces: ForceCard[];
}

export interface Player {
  hand: Hand;
  token: {
    workers: number;
    actions: number;
  };
  completed: {
    projects: ProjectCard[];
  };
  victoryPoints: number;
}

export type Players = Record<PlayerID, Player>;

export const setupPlayers = (playerNames: string[]): Players => {
  const players: Players = {};
  playerNames.forEach(player => {
    players[player] = {
      hand: { projects: [], forces: [] },
      token: { workers: 0, actions: 0 },
      completed: { projects: [] },
      victoryPoints: 0,
    }
  });
  return players;
}
