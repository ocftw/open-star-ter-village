import { INVALID_MOVE } from 'boardgame.io/core';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { Recruit, recruit } from './recruit';
import { ContributeOwnedProjects, contributeOwnedProjects } from './contributeOwnedProjects';
import { RemoveAndRefillJobs, removeAndRefillJobs } from './removeAndRefillJobs';
import { ContributeJoinedProjects, contributeJoinedProjects } from './contributeJoinedProjects';
import { ActionMoveName } from './type';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { CreateProject, createProject } from './createProject';
import { validateMirror } from '@/game/core/stage/action/validate';

export type Mirror = (actionName: ActionMoveName, ...params: any[]) => void;
export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G, playerID } = context;

  // ── All validation upfront, before any state mutation ──
  // Shared validation: same predicates the client preflight runs.
  if (actionName === 'mirror') {
    return INVALID_MOVE;
  }
  // mirror historically returns INVALID_MOVE directly instead of throwing.
  const result = validateMirror(G, playerID, actionName);
  if (!result.valid) {
    return INVALID_MOVE;
  }
  const mirrorActionCost = RuleSelector.getActionTokenCost(G.rules, 'mirror');
  const targetSlot = G.table.actionSlots[actionName];

  // ── Mutate only after all checks pass ──
  PlayersMutator.useActionTokens(G.players, playerID, mirrorActionCost);
  ActionSlotMutator.occupy(G.table.actionSlots.mirror);

  // Temporarily free the target slot so the sub-move's isOccupied guard passes.
  // If the sub-move throws, withErrorBoundary (at the boardgame.io level) returns
  // INVALID_MOVE and Immer discards the entire draft including this reset.
  ActionSlotMutator.reset(targetSlot);

  let subMoveResult = null;
  switch (actionName) {
    case 'createProject':
      subMoveResult = createProject(context, ...(params as Parameters<CreateProject>));
      break;
    case 'recruit':
      subMoveResult = recruit(context, ...(params as Parameters<Recruit>));
      break;
    case 'contributeOwnedProjects':
      subMoveResult = contributeOwnedProjects(context, ...(params as Parameters<ContributeOwnedProjects>));
      break;
    case 'contributeJoinedProjects':
      subMoveResult = contributeJoinedProjects(context, ...(params as Parameters<ContributeJoinedProjects>));
      break;
    case 'removeAndRefillJobs':
      subMoveResult = removeAndRefillJobs(context, ...(params as Parameters<RemoveAndRefillJobs>));
      break;
    default:
      subMoveResult = INVALID_MOVE;
      break;
  }

  if (subMoveResult === INVALID_MOVE) {
    return INVALID_MOVE;
  }
};
