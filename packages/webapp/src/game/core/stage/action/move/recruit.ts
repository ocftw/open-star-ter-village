import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { CardsMutator, CardsSelector } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';

export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID, events }, jobCardIndex, activeProjectIndex) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.recruit)) {
    return INVALID_MOVE;
  }

  const currentPlayerToken = G.players[playerID].token;
  const recruitActionCosts = 1;
  if (currentPlayerToken.actions < recruitActionCosts) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.recruit);

  const recruitWorkerCosts = 1;
  if (currentPlayerToken.workers < recruitWorkerCosts) {
    return INVALID_MOVE;
  }

  if (!isInRange(jobCardIndex, G.table.jobSlots.length)) {
    return INVALID_MOVE;
  }

  const activeProjects = G.table.projectBoard;
  if (!isInRange(activeProjectIndex, activeProjects.length)) {
    return INVALID_MOVE;
  }
  const jobCard = CardsSelector.getById(G.table.jobSlots, jobCardIndex);
  const activeProject = ProjectBoardSelector.getById(G.table.projectBoard, activeProjectIndex);
  const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobCard.name);
  // Check job requirment is not fulfilled yet
  if (jobContribution >= activeProject.card.requirements[jobCard.name]) {
    return INVALID_MOVE;
  }
  // User cannot place more than one worker in same job
  if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, playerID)) {
    return INVALID_MOVE;
  }

  // reduce action
  currentPlayerToken.actions -= recruitActionCosts;
  CardsMutator.removeOne(G.table.jobSlots, jobCard);

  // reduce worker tokens
  currentPlayerToken.workers -= recruitWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, playerID, jobInitPoints);

  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 8;
  const refillCardNumber = maxJobCards - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(G.table.jobSlots, jobCards);


  // end stage if no action tokens left
  if (PlayersSelector.getNumActionTokens(G.players, playerID) === 0) {
    events.endStage();
  }
};
