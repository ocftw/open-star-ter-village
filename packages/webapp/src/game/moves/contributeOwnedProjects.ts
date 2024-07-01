import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '../utils';
import { ProjectBoardSelector } from '../store/slice/projectBoard';
import { ProjectSlotMutator, ProjectSlotSelector } from '../store/slice/projectSlot/projectSlot';
import { GameMove, ContributionAction } from './type';
import { ActionSlotMutator, ActionSlotSelector } from '../store/slice/actionSlot';

export type ContributeOwnedProjects = (contributions: ContributionAction[]) => void;

export const contributeOwnedProjects: GameMove<ContributeOwnedProjects> = ({ G, playerID }, contributions) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.contributeOwnedProjects)) {
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
    if (activeProject.owner !== currentPlayer) {
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
  const maxOwnedContributions = 4;
  if (totalContributions > maxOwnedContributions) {
    return INVALID_MOVE;
  }

  // deduct action tokens
  currentPlayerToken.actions -= contributeActionCosts;
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ProjectBoardSelector.getById(G.table.projectBoard, activeProjectIndex);
    ProjectSlotMutator.pushWorker(activeProject, jobName, currentPlayer, value);
  });

  ActionSlotMutator.occupy(G.table.actionSlots.contributeOwnedProjects);
};
