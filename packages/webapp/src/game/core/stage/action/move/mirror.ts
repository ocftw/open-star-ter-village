import { INVALID_MOVE } from 'boardgame.io/core';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { CreateProject, createProject } from './createProject';
import { Recruit, recruit } from './recruit';
import { ContributeOwnedProjects, contributeOwnedProjects } from './contributeOwnedProjects';
import { RemoveAndRefillJobs, removeAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects, contributeJoinedProjects } from './contributeJoinedProjects';
import { ActionMoveName } from './type';

export type Mirror = (actionName: ActionMoveName, ...params: any[]) => void;
export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G } = context;
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.mirror)) {
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

  ActionSlotMutator.occupy(G.table.actionSlots.mirror);
};
