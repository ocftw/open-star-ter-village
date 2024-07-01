import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '../utils';
import { ProjectBoardSelector } from '../store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '../store/slice/deck';
import { ProjectSlotMutator, ProjectSlotSelector } from '../store/slice/projectSlot/projectSlot';
import { GameMove } from './type';
import { CardsMutator, CardsSelector } from '../store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '../store/slice/actionSlot';

export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardIndex, activeProjectIndex) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.recruit)) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID;
  const currentPlayerToken = G.players[currentPlayer].token;
  const recruitActionCosts = 1;
  if (currentPlayerToken.actions < recruitActionCosts) {
    return INVALID_MOVE;
  }
  const recruitWorkerCosts = 1;
  if (currentPlayerToken.workers < recruitWorkerCosts) {
    return INVALID_MOVE;
  }

  const currentJobs = G.table.jobSlots;
  if (!isInRange(jobCardIndex, currentJobs.length)) {
    return INVALID_MOVE;
  }

  const activeProjects = G.table.projectBoard;
  if (!isInRange(activeProjectIndex, activeProjects.length)) {
    return INVALID_MOVE;
  }
  const jobCard = CardsSelector.getById(currentJobs, jobCardIndex);
  const activeProject = ProjectBoardSelector.getById(G.table.projectBoard, activeProjectIndex);
  const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobCard.name);
  // Check job requirment is not fulfilled yet
  if (jobContribution >= activeProject.card.requirements[jobCard.name]) {
    return INVALID_MOVE;
  }
  // User cannot place more than one worker in same job
  if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, currentPlayer)) {
    return INVALID_MOVE;
  }

  // reduce action
  currentPlayerToken.actions -= recruitActionCosts;
  CardsMutator.removeOne(currentJobs, jobCard);

  // reduce worker tokens
  currentPlayerToken.workers -= recruitWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);

  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(currentJobs, jobCards);

  ActionSlotMutator.occupy(G.table.actionSlots.recruit);
};
