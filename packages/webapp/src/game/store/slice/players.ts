import { PlayerID } from "boardgame.io";
import { ForceCard, ProjectCard } from "../../card";

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

const playerInitialState = (): Player => ({
  hand: { projects: [], forces: [] },
  token: { workers: 0, actions: 0 },
  completed: { projects: [] },
  victoryPoints: 0,
});

export type Players = Record<PlayerID, Player>;

const initialState = (): Players => ({});

export const initialize = (state: Players, playerNames: string[]): void => {
  playerNames.forEach(player => {
    state[player] = playerInitialState();
  });
}

const PlayersSlice = {
  initialState,
  mutators: {
    initialize,
  },
};

export const PlayersMutator = PlayersSlice.mutators;
export default PlayersSlice;
