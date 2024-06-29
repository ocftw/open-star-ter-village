import { INVALID_MOVE } from 'boardgame.io/core';
import { CreateProject, createProject } from './createProject';
import { GameMove, ActionMoves } from './actionMoves';
import { Recruit, recruit } from './recruit';
import { ContributeOwnedProjects, contributeOwnedProjects } from './contributeOwnedProjects';
import { RemoveAndRefillJobs, removeAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects, contributeJoinedProjects } from './contributeJoinedProjects';

export type Mirror = (actionName: keyof ActionMoves, ...params: any[]) => void;
export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G } = context;
  if (!G.table.activeActionMoves.mirror) {
    return INVALID_MOVE;
  }

  // TODO: add token to bypass the active moves check when its inactive
  let result = null;
  switch (actionName) {
    case 'createProject':
      result = createProject(context, ...(params as Parameters<CreateProject>));
      break;
    case 'recruit':
      result = recruit(context, ...(params as Parameters<Recruit>));
      break;
    case 'contributeOwnedProjects':
      result = contributeOwnedProjects(context, ...(params as Parameters<ContributeOwnedProjects>));
      break;
    case 'contributeJoinedProjects':
      result = contributeJoinedProjects(context, ...(params as Parameters<ContributeJoinedProjects>));
      break;
    case 'removeAndRefillJobs':
      result = removeAndRefillJobs(context, ...(params as Parameters<RemoveAndRefillJobs>));
      break;
    default:
      result = INVALID_MOVE;
      break;
  }

  // TODO: remove the token
  if (result === INVALID_MOVE) {
    return INVALID_MOVE;
  }

  G.table.activeActionMoves.mirror = false;
};
