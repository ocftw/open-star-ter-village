import { createProject } from "./move/createProject";
import { recruit } from "./move/recruit";
import { contributeOwnedProjects } from "./move/contributeOwnedProjects";
import { contributeJoinedProjects } from "./move/contributeJoinedProjects";
import { removeAndRefillJobs } from "./move/removeAndRefillJobs";
import { mirror } from "./move/mirror";
import { GameStageConfig } from "@/game/core/type";

export const action: GameStageConfig = {
  moves: {
    createProject: {
      client: false,
      move: createProject,
    },
    recruit: {
      // client cannot see decks, discard job card should evaluated on server side
      client: false,
      move: recruit,
    },
    contributeOwnedProjects: {
      client: false,
      move: contributeOwnedProjects,
    },
    contributeJoinedProjects: {
      client: false,
      move: contributeJoinedProjects,
    },
    removeAndRefillJobs: {
      client: false,
      move: removeAndRefillJobs,
    },
    mirror: {
      client: false,
      move: mirror,
    },
  },
  next: 'settle',
};
