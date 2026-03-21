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

  // ── All validation upfront, before any state mutation ──
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'mirror')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.mirror)) {
    return INVALID_MOVE;
  }
  const mirrorActionCost = RuleSelector.getActionTokenCost(G.rules, 'mirror');
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < mirrorActionCost) {
    return INVALID_MOVE;
  }
  // Only 1-AP actions can be mirrored (Doin' Overtime rule)
  if (RuleSelector.getActionTokenCost(G.rules, actionName) > mirrorActionCost) {
    return INVALID_MOVE;
  }
  // The target action must have already been completed this turn (slot is occupied)
  const targetSlot = G.table.actionSlots[actionName];
  if (!ActionSlotSelector.isOccupied(targetSlot)) {
    return INVALID_MOVE;
  }

  // ── Mutate only after all checks pass ──
  PlayersMutator.useActionTokens(G.players, playerID, mirrorActionCost);
  ActionSlotMutator.occupy(G.table.actionSlots.mirror);

  // Temporarily free the target slot so the sub-move's isOccupied guard passes.
  // If the sub-move throws, withErrorBoundary (at the boardgame.io level) returns
  // INVALID_MOVE and Immer discards the entire draft including this reset.
  ActionSlotMutator.reset(targetSlot);

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

  if (result === INVALID_MOVE) {
    return INVALID_MOVE;
  }
};
