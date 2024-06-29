import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '../utils';
import { ActiveProjectsSelector } from '../store/slice/activeProjects';
import { ActiveProjectMutator, ActiveProjectSelector } from '../store/slice/activeProject/activeProject';
import { GameMove, ContributionAction } from './actionMoves';

export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;
export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({ G, ctx, playerID }, contributions) => {
  if (!G.table.activeActionMoves.contributeJoinedProjects) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID;
  const currentPlayerToken = G.players[currentPlayer].token;
  const contributeActionCosts = 1;
  if (currentPlayerToken.actions < contributeActionCosts) {
    return INVALID_MOVE;
  }
  const activeProjects = G.table.activeProjects;
  const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
    if (!isInRange(activeProjectIndex, activeProjects.length)) {
      return true;
    }
    const activeProject = ActiveProjectsSelector.getById(activeProjects, activeProjectIndex);
    if (activeProject.owner === currentPlayer) {
      return true;
    }

    if (!ActiveProjectSelector.hasWorker(activeProject, jobName, currentPlayer)) {
      return true;
    }
  }).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
  const maxJoinedContributions = 3;
  if (totalContributions > maxJoinedContributions) {
    return INVALID_MOVE;
  }

  // deduct action tokens
  currentPlayerToken.actions -= contributeActionCosts;
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ActiveProjectsSelector.getById(G.table.activeProjects, activeProjectIndex);
    ActiveProjectMutator.pushWorker(activeProject, jobName, currentPlayer, value);
  });

  G.table.activeActionMoves.contributeJoinedProjects = false;
};
