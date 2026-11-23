import { createProject } from "./move/createProject";
import { recruit } from "./move/recruit";
import { contributeOwnedProjects } from "./move/contributeOwnedProjects";
import { contributeJoinedProjects } from "./move/contributeJoinedProjects";
import { removeAndRefillJobs } from "./move/removeAndRefillJobs";
import { endActionTurn } from "./move/endActionTurn";
import { discardExcessJobCards } from "./move/discardExcessJobCards";
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
    // Public-only (#445 DB-P6): the body reads only the mover's own player
    // state, the project board and rules, so the client predicts it right
    // away; the server broadcast (including any turn end) reconciles.
    contributeOwnedProjects: {
      move: withErrorBoundary(contributeOwnedProjects, INVALID_MOVE),
    },
    contributeJoinedProjects: {
      move: withErrorBoundary(contributeJoinedProjects, INVALID_MOVE),
    },
    removeAndRefillJobs: {
      client: false,
      move: withErrorBoundary(removeAndRefillJobs, INVALID_MOVE),
    },
    // Hidden-info moves (#445 DB-C5-H): deck draws/discards, or a result that is
    // the server-side turn end (refill, settle, event draw). The client shows a
    // pending visual and the server broadcast fills the result.
    endActionTurn: {
      client: false,
      move: withErrorBoundary(endActionTurn, INVALID_MOVE),
    },
    discardExcessJobCards: {
      client: false,
      move: withErrorBoundary(discardExcessJobCards, INVALID_MOVE),
    },
  },
};
