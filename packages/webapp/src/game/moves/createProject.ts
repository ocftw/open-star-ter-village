import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '../utils';
import { ActiveProjectsMutator, ActiveProjectsSelector } from '../store/slice/activeProjects';
import { DeckMutator, DeckSelector } from '../store/slice/deck';
import { ActiveProjectMutator } from '../store/slice/activeProject/activeProject';
import { GameMove } from './actionMoves';
import { CardsMutator, CardsSelector } from '../store/slice/cards';

export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;
export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardIndex, jobCardIndex) => {
  if (!G.table.activeActionMoves.createProject) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID;
  const currentPlayerToken = G.players[currentPlayer].token;
  // TODO: replace hardcoded number with dynamic rules
  const createProjectActionCosts = 2;
  if (currentPlayerToken.actions < createProjectActionCosts) {
    return INVALID_MOVE;
  }
  const createProjectWorkerCosts = 1;
  if (currentPlayerToken.workers < createProjectWorkerCosts) {
    return INVALID_MOVE;
  }

  // check project card in in hand
  const currentHandProjects = G.players[currentPlayer].hand.projects;
  if (!isInRange(projectCardIndex, currentHandProjects.length)) {
    return INVALID_MOVE;
  }

  // check job card is on the table
  const currentJobs = G.table.activeJobs;
  if (!isInRange(jobCardIndex, currentJobs.length)) {
    return INVALID_MOVE;
  }

  // check job card is required in project
  const projectCard = CardsSelector.getById(currentHandProjects, projectCardIndex);
  const jobCard = CardsSelector.getById(currentJobs, jobCardIndex);
  if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
    return INVALID_MOVE;
  }

  // reduce action tokens
  currentPlayerToken.actions -= createProjectActionCosts;
  CardsMutator.removeOne(currentHandProjects, projectCard);
  CardsMutator.removeOne(currentJobs, jobCard);

  // initial active project
  ActiveProjectsMutator.add(G.table.activeProjects, projectCard, currentPlayer);
  const activeProject = ActiveProjectsSelector.getLast(G.table.activeProjects);

  // reduce worker token
  currentPlayerToken.workers -= createProjectWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ActiveProjectMutator.assignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);
  // score victory points
  const createProjectVictoryPoints = 1;
  G.players[currentPlayer].victoryPoints += createProjectVictoryPoints;

  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(currentJobs, jobCards);

  G.table.activeActionMoves.createProject = false;
};
