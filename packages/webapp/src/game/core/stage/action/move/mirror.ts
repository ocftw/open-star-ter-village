import { INVALID_MOVE } from 'boardgame.io/core';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { Recruit, recruit } from './recruit';
import { ContributeOwnedProjects, contributeOwnedProjects } from './contributeOwnedProjects';
import { RemoveAndRefillJobs, removeAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects, contributeJoinedProjects } from './contributeJoinedProjects';
import { ActionMoveName } from './type';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { CreateProject, createProject } from './createProject';

export type Mirror = (actionName: ActionMoveName, ...params: any[]) => void;
export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G, playerID } = context;
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'mirror')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.mirror)) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  const mirrorActionCost = RuleSelector.getActionTokenCost(G.rules, 'mirror');
  PlayersMutator.useActionTokens(G.players, playerID, mirrorActionCost);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.mirror);

  if (RuleSelector.getActionTokenCost(G.rules, actionName) <= mirrorActionCost) {
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
};
