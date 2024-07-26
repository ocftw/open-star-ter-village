import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';

export type ContributeOwnedProjects = (contributions: ContributionAction[]) => void;

export const contributeOwnedProjects: GameMove<ContributeOwnedProjects> = ({ G, playerID }, contributions) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'contributeOwnedProjects')) {
    throw new Error('Action slot is not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.contributeOwnedProjects)) {
    throw new Error('Action slot is occupied');
  }

  console.log('use action tokens')
  const contributeActionCosts = RuleSelector.getActionTokenCost(G.rules, 'contributeOwnedProjects');
  PlayersMutator.useActionTokens(G.players, playerID, contributeActionCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    throw new Error('Not enough action tokens');
  }
  ActionSlotMutator.occupy(G.table.actionSlots.contributeOwnedProjects);

  contributions.forEach(({ projectSlotId, jobName }) => {
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    if (!projectSlot) {
      throw new Error('Project slot not found');
    }
    const projectOwner = ProjectSlotSelector.getOwner(projectSlot);
    if (projectOwner.owner !== playerID) {
      throw new Error('Project slot is not owned by player');
    }

    if (!ProjectSlotSelector.hasWorker(projectSlot, jobName, playerID)) {
      throw new Error('No worker token');
    }
  });

  const totalContributions = getTotalContributionValue(contributions);
  const maxOwnedContributions = RuleSelector.getMaxContributionValue(G.rules, 'contributeOwnedProjects');
  if (totalContributions > maxOwnedContributions) {
    throw new Error('Exceed maximum contribution value');
  }

  console.log('update contributions')
  contributions.forEach(({ projectSlotId, jobName, value }) => {
    // update contributions to given contribution points
    const projectSlot = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
    ProjectSlotMutator.pushWorker(projectSlot!, jobName, playerID, value);
  });
};
