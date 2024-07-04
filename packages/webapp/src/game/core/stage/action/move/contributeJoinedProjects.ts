import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove, ContributionAction } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';

export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;

export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({ G, ctx, playerID }, contributions) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.contributeJoinedProjects)) {
    return INVALID_MOVE;
  }
  if (contributions.length < 1) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID;
  const currentPlayerToken = G.players[currentPlayer].token;
  const contributeActionCosts = 1;
  if (currentPlayerToken.actions < contributeActionCosts) {
    return INVALID_MOVE;
  }
  const activeProjects = G.table.projectBoard;
  const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
    if (!isInRange(activeProjectIndex, activeProjects.length)) {
      return true;
    }
    const activeProject = ProjectBoardSelector.getById(activeProjects, activeProjectIndex);
    if (activeProject.owner === currentPlayer) {
      return true;
    }

    if (!ProjectSlotSelector.hasWorker(activeProject, jobName, currentPlayer)) {
      return true;
    }
  }).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
  const maxJoinedContributions = 5;
  if (totalContributions > maxJoinedContributions) {
    return INVALID_MOVE;
  }

  // deduct action tokens
  currentPlayerToken.actions -= contributeActionCosts;
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ProjectBoardSelector.getById(G.table.projectBoard, activeProjectIndex);
    ProjectSlotMutator.pushWorker(activeProject, jobName, currentPlayer, value);
  });

  ActionSlotMutator.occupy(G.table.actionSlots.contributeJoinedProjects);
};
