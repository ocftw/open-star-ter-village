import { growTree } from '@/game/standard/engine';
import { createProject } from "./move/createProject";
import { recruit } from "./move/recruit";
import { contributeOwnedProjects } from "./move/contributeOwnedProjects";
import { contributeJoinedProjects } from "./move/contributeJoinedProjects";
import { removeAndRefillJobs } from "./move/removeAndRefillJobs";
import { endActionTurn } from "./move/endActionTurn";
import { discardExcessJobCards } from "./move/discardExcessJobCards";
import { GameStageConfig } from "@/game/core/type";
import { INVALID_MOVE } from 'boardgame.io/core';
import { publicProjects, recordHistory } from '@/game/standard/history';
import type { GameState } from '@/game/store/store';

const withErrorBoundary = (moveFn: (...args: any[]) => any, fallback: any, kind: string) => (...args: any[]) => {
  try {
    const { G, playerID } = args[0] as { G: GameState; playerID: string };
    const beforeProjects = G.standard ? publicProjects(G) : [];
    const beforeScores = { ...G.table.scoreBoard };
    const result = moveFn(...args);
    if (result !== INVALID_MOVE && G.standard) {
      const projects = publicProjects(G).filter(project => JSON.stringify(project) !== JSON.stringify(beforeProjects.find(previous => previous.id === project.id)));
      recordHistory(G, { kind, playerId: playerID, projects,
        ...(kind === 'removeAndRefillJobs' || kind === 'discardExcessJobCards' ? { market: G.table.jobSlots.map(card => card.name) } : {}),
      });
      for (const [id, score] of Object.entries(G.table.scoreBoard)) {
        const scoreDelta = score - beforeScores[id];
        if (scoreDelta) recordHistory(G, { kind: 'score', playerId: id, target: '行動獎勵', scoreDelta, projects });
      }
    }
    return result;
  } catch (e) {
    console.error(e);
  }
  return fallback;
};

export const action: GameStageConfig = {
  moves: {
    growTree: { client: false, move: growTree },
    createProject: {
      client: false,
      move: withErrorBoundary(createProject, INVALID_MOVE, 'createProject'),
    },
    recruit: {
      // client cannot see decks, discard job card should evaluated on server side
      client: false,
      move: withErrorBoundary(recruit, INVALID_MOVE, 'recruit'),
    },
    contributeOwnedProjects: {
      client: false,
      move: withErrorBoundary(contributeOwnedProjects, INVALID_MOVE, 'contributeOwnedProjects'),
    },
    contributeJoinedProjects: {
      client: false,
      move: withErrorBoundary(contributeJoinedProjects, INVALID_MOVE, 'contributeJoinedProjects'),
    },
    removeAndRefillJobs: {
      client: false,
      move: withErrorBoundary(removeAndRefillJobs, INVALID_MOVE, 'removeAndRefillJobs'),
    },
    endActionTurn: {
      client: false,
      move: withErrorBoundary(endActionTurn, INVALID_MOVE, 'endActionTurn'),
    },
    discardExcessJobCards: {
      client: false,
      move: withErrorBoundary(discardExcessJobCards, INVALID_MOVE, 'discardExcessJobCards'),
    },
  },
};
