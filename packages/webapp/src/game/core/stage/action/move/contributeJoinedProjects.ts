import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';

export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;

export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({ G, playerID }, contributions) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'contributeJoinedProjects')) {
    throw new Error('Action slot is not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.contributeJoinedProjects)) {
    throw new Error('Action slot is occupied');
  }

  // Validate token balance before mutating state
  const actionCosts = RuleSelector.getActionTokenCost(G.rules, 'contributeJoinedProjects');
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < actionCosts) {
    throw new Error('Not enough action tokens');
  }

  // All token checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.contributeJoinedProjects);

  contributions.forEach(({ projectSlotId, jobName }) => {
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    if (!projectSlot) {
      throw new Error('Project slot not found');
    }
    const projectOwner = ProjectSlotSelector.getOwner(projectSlot);
    if (projectOwner.owner === playerID) {
      throw new Error('Project slot is owned by player');
    }

    if (!ProjectSlotSelector.hasWorker(projectSlot, jobName, playerID)) {
      throw new Error('No worker token');
    }
  });

  const totalContributions = getTotalContributionValue(contributions);
  const maxContributions = RuleSelector.getMaxContributionValue(G.rules, 'contributeJoinedProjects');
  if (totalContributions > maxContributions) {
    throw new Error('Exceed maximum contribution value');
  }

  contributions.forEach(({ projectSlotId, jobName, value }) => {
    // update contributions to given contribution points
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    ProjectSlotMutator.pushWorker(projectSlot!, jobName, playerID, value);
  });
};
