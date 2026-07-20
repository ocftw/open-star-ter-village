import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ContributionAction } from '@/game/core/ContributionAction';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionValidationError, validateContributeOwnedProjects } from '@/game/core/stage/action/validate';

export type ContributeOwnedProjects = (contributions: ContributionAction[]) => void;

export const contributeOwnedProjects: GameMove<ContributeOwnedProjects> = ({ G, playerID }, contributions) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateContributeOwnedProjects(G, playerID, contributions);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const contributeActionCosts = RuleSelector.getActionTokenCost(G.rules, 'contributeOwnedProjects');

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, contributeActionCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.contributeOwnedProjects);

  contributions.forEach(({ projectSlotId, jobName, value }) => {
    // update contributions to given contribution points
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    ProjectSlotMutator.pushWorker(projectSlot!, jobName, playerID, value);
  });
};
