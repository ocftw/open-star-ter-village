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

const getNumWorkerTokens = (state: Players, playerId: PlayerID): number => {
  return state[playerId].token.workers;
};

const getNumActionTokens = (state: Players, playerId: PlayerID): number => {
  return state[playerId].token.actions;
};

const getNumProjects = (state: Players, playerId: PlayerID): number => {
  return state[playerId].hand.projects.length;
};

const addProjects = (state: Players, playerId: PlayerID, projects: ProjectCard[]): void => {
  state[playerId].hand.projects.push(...projects);
};

const useProject = (state: Players, playerId: PlayerID, project: ProjectCard): void => {
  // remove the first project that matches the project card
  const index = state[playerId].hand.projects.findIndex(p => p.name === project.name);
  state[playerId].hand.projects.splice(index, 1);
};

const addWorkerTokens = (state: Players, playerId: PlayerID, numWorkers: number): void => {
  state[playerId].token.workers += numWorkers;
};

const useWorkerTokens = (state: Players, playerId: PlayerID, numWorkers: number): void => {
  state[playerId].token.workers -= numWorkers;
};

const resetWorkerTokens = (state: Players, playerId: PlayerID, numWorkers: number): void => {
  state[playerId].token.workers = numWorkers;
};

const useActionTokens = (state: Players, playerId: PlayerID, numActions: number): void => {
  state[playerId].token.actions -= numActions;
};

const resetActionTokens = (state: Players, playerId: PlayerID, numActions: number): void => {
  state[playerId].token.actions = numActions;
};

const PlayersSlice = {
  initialState,
  mutators: {
    initialize,
    addProjects,
    useProject,
    addWorkerTokens,
    useWorkerTokens,
    resetWorkerTokens,
    useActionTokens,
    resetActionTokens,
  },
  selectors: {
    getNumWorkerTokens,
    getNumActionTokens,
    getNumProjects,
  },
};

export const PlayersMutator = PlayersSlice.mutators;
export const PlayersSelector = PlayersSlice.selectors;
export default PlayersSlice;
