import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove, ContributionAction } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';

export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;

export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({ G, playerID, events }, contributions) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'contributeJoinedProjects')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.contributeJoinedProjects)) {
    return INVALID_MOVE;
  }
  if (contributions.length < 1) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  const actionCosts = RuleSelector.getActionTokenCost(G.rules, 'contributeJoinedProjects');
  PlayersMutator.useActionTokens(G.players, playerID, actionCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.contributeJoinedProjects);

  const activeProjects = G.table.projectBoard;
  const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
    if (!isInRange(activeProjectIndex, activeProjects.length)) {
      return true;
    }
    const activeProject = ProjectBoardSelector.getById(activeProjects, activeProjectIndex);
    if (activeProject.owner === playerID) {
      return true;
    }

    if (!ProjectSlotSelector.hasWorker(activeProject, jobName, playerID)) {
      return true;
    }
  }).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
  const maxContributions = RuleSelector.getMaxContributionValue(G.rules, 'contributeJoinedProjects');
  if (totalContributions > maxContributions) {
    return INVALID_MOVE;
  }

  console.log('update contributions')
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ProjectBoardSelector.getById(G.table.projectBoard, activeProjectIndex);
    ProjectSlotMutator.pushWorker(activeProject, jobName, playerID, value);
  });
};
