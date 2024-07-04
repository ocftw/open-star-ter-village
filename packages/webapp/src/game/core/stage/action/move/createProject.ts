import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { CardsMutator, CardsSelector } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator } from '@/game/store/slice/players';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';

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
  const recruitWorkerCosts = 1;
  const totalWorkerCosts = createProjectWorkerCosts + recruitWorkerCosts;
  if (currentPlayerToken.workers < totalWorkerCosts) {
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
  PlayersMutator.useActionTokens(G.players, currentPlayer, createProjectActionCosts);

  // create project
  PlayersMutator.useProject(G.players, currentPlayer, projectCard);
  // assign worker token to owner slot
  PlayersMutator.useWorkerTokens(G.players, currentPlayer, createProjectWorkerCosts);
  ProjectBoardMutator.add(G.table.projectBoard, projectCard);

  const projectSlot = ProjectBoardSelector.getLast(G.table.projectBoard);
  ProjectSlotMutator.assignOwner(projectSlot, currentPlayer, createProjectWorkerCosts);


  JobSlotsMutator.removeJobCard(currentJobs, jobCard);
  // assign worker token to job slot
  PlayersMutator.useWorkerTokens(G.players, currentPlayer, recruitWorkerCosts);
  const jobInitPoints = 1;
  ProjectSlotMutator.assignWorker(projectSlot, jobCard.name, currentPlayer, jobInitPoints);

  const createProjectVictoryPoints = 2;
  ScoreBoardMutator.add(G.table.scoreBoard, currentPlayer, createProjectVictoryPoints);

  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 6;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(currentJobs, jobCards);

  ActionSlotMutator.occupy(G.table.actionSlots.createProject);
};
