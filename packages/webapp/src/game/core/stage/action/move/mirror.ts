import { INVALID_MOVE } from 'boardgame.io/core';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { Recruit, recruit } from './recruit';
import { ContributeOwnedProjects, contributeOwnedProjects } from './contributeOwnedProjects';
import { RemoveAndRefillJobs, removeAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects, contributeJoinedProjects } from './contributeJoinedProjects';
import { ActionMoveName } from './type';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';

export type Mirror = (actionName: ActionMoveName, ...params: any[]) => void;
export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G } = context;
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.mirror)) {
    return INVALID_MOVE;
  }

  const mirrorActionCosts = 1;
  const actionTokens = PlayersSelector.getNumActionTokens(G.players, context.playerID);
  if (actionTokens < mirrorActionCosts) {
    return INVALID_MOVE;
  }
  PlayersMutator.useActionTokens(G.players, context.playerID, mirrorActionCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.mirror);

  // TODO: add token to bypass the active moves check when its inactive
  let result = null;
  switch (actionName) {
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
};
