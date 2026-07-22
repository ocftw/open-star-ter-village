import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ContributionAction } from '@/game/core/ContributionAction';
import { ActionExecutionOptions, ActionValidationError, validateContributeOwnedProjects } from '@/game/core/stage/action/validate';
import { applyActionCost } from './applyActionCost';

export type ContributeOwnedProjects = (
  contributions: ContributionAction[],
  options?: ActionExecutionOptions,
) => void;

export const contributeOwnedProjects: GameMove<ContributeOwnedProjects> = ({ G, playerID }, contributions, options) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateContributeOwnedProjects(G, playerID, contributions, options);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'contributeOwnedProjects', options);

  contributions.forEach(({ projectSlotId, jobName, value }) => {
    // update contributions to given contribution points
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    ProjectSlotMutator.pushWorker(projectSlot!, jobName, playerID, value);
  });
};
