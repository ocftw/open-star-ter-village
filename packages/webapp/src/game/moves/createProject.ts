import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '../utils';
import { ProjectBoardMutator, ProjectBoardSelector } from '../store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '../store/slice/deck';
import { ProjectSlotMutator } from '../store/slice/projectSlot/projectSlot';
import { GameMove } from './type';
import { CardsMutator, CardsSelector } from '../store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '../store/slice/actionSlot';
import { ScoreBoardMutator } from '../store/slice/scoreBoard';

export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardIndex, jobCardIndex) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.createProject)) {
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
  const currentJobs = G.table.jobSlots;
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
  ProjectBoardMutator.add(G.table.projectBoard, projectCard, currentPlayer);
  const activeProject = ProjectBoardSelector.getLast(G.table.projectBoard);

  // reduce worker token
  currentPlayerToken.workers -= createProjectWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);
  // score victory points
  const createProjectVictoryPoints = 2;
  ScoreBoardMutator.add(G.table.scoreBoard, currentPlayer, createProjectVictoryPoints);

  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(currentJobs, jobCards);

  ActionSlotMutator.occupy(G.table.actionSlots.createProject);
};
