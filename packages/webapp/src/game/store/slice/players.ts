import { PlayerID } from "boardgame.io";
import { ProjectCard } from "../../card";

export interface Hand {
  projects: ProjectCard[];
}

export interface Player {
  hand: Hand;
  token: {
    workers: number;
    actions: number;
  };
}

const playerInitialState = (): Player => ({
  hand: { projects: [] },
  token: { workers: 0, actions: 0 },
});

export type Players = Record<PlayerID, Player>;

const initialState = (): Players => ({});

const initialize = (state: Players, playerNames: PlayerID[]): void => {
  playerNames.forEach(player => {
    state[player] = playerInitialState();
  });
}

const addProjects = (state: Players, playerId: PlayerID, projects: ProjectCard[]): void => {
  state[playerId].hand.projects.push(...projects);
};

const useProject = (state: Players, playerId: PlayerID, project: ProjectCard): void => {
  // remove the first project that matches the project card
  const index = state[playerId].hand.projects.findIndex(p => p.name === project.name);
  state[playerId].hand.projects.splice(index, 1);
};

const useWorker = (state: Players, playerId: PlayerID, numWorkers: number): void => {
  state[playerId].token.workers -= numWorkers;
};

const resetWorkers = (state: Players, playerId: PlayerID, numWorkers: number): void => {
  state[playerId].token.workers = numWorkers;
};

const useAction = (state: Players, playerId: PlayerID, numActions: number): void => {
  state[playerId].token.actions -= numActions;
};

const resetActions = (state: Players, playerId: PlayerID, numActions: number): void => {
  state[playerId].token.actions = numActions;
};

const PlayersSlice = {
  initialState,
  mutators: {
    initialize,
    addProjects,
    useProject,
    useWorker,
    resetWorkers,
    useAction,
    resetActions,
  },
};

export const PlayersMutator = PlayersSlice.mutators;
export default PlayersSlice;
