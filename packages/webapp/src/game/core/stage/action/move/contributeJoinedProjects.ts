import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ContributionAction } from '@/game/core/ContributionAction';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionValidationError, validateContributeJoinedProjects } from '@/game/core/stage/action/validate';

export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;

export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({ G, playerID }, contributions) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateContributeJoinedProjects(G, playerID, contributions);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const actionCosts = RuleSelector.getActionTokenCost(G.rules, 'contributeJoinedProjects');

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.contributeJoinedProjects);

  contributions.forEach(({ projectSlotId, jobName, value }) => {
    // update contributions to given contribution points
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    ProjectSlotMutator.pushWorker(projectSlot!, jobName, playerID, value);
  });
};
