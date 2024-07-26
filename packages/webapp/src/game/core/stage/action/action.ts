import { createProject } from "./move/createProject";
import { recruit } from "./move/recruit";
import { contributeOwnedProjects } from "./move/contributeOwnedProjects";
import { contributeJoinedProjects } from "./move/contributeJoinedProjects";
import { removeAndRefillJobs } from "./move/removeAndRefillJobs";
import { mirror } from "./move/mirror";
import { GameStageConfig } from "@/game/core/type";
import { INVALID_MOVE } from 'boardgame.io/core';

const withErrorBoundary = (moveFn: (...args: any[]) => any, fallback: any) => (...args: any[]) => {
  try {
    return moveFn(...args);
  } catch (e) {
    console.error(e);
  }
  return fallback;
};

export const action: GameStageConfig = {
  moves: {
    createProject: {
      client: false,
      move: withErrorBoundary(createProject, INVALID_MOVE),
    },
    recruit: {
      // client cannot see decks, discard job card should evaluated on server side
      client: false,
      move: withErrorBoundary(recruit, INVALID_MOVE),
    },
    contributeOwnedProjects: {
      client: false,
      move: withErrorBoundary(contributeOwnedProjects, INVALID_MOVE),
    },
    contributeJoinedProjects: {
      client: false,
      move: withErrorBoundary(contributeJoinedProjects, INVALID_MOVE),
    },
    removeAndRefillJobs: {
      client: false,
      move: withErrorBoundary(removeAndRefillJobs, INVALID_MOVE),
    },
    mirror: {
      client: false,
      move: withErrorBoundary(mirror, INVALID_MOVE),
    },
  },
};
