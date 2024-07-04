import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { CardsMutator, CardsSelector } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';

export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID, events }, projectCardIndex, jobCardIndex) => {
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.createProject)) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  const actionTokens = PlayersSelector.getNumActionTokens(G.players, playerID);
  // TODO: replace hardcoded number with dynamic rules
  const createProjectActionCosts = 2;
  if (actionTokens < createProjectActionCosts) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.createProject);
  PlayersMutator.useActionTokens(G.players, playerID, createProjectActionCosts);

  console.log('use worker tokens')
  const createProjectWorkerCosts = 1;
  const recruitWorkerCosts = 1;
  const totalWorkerCosts = createProjectWorkerCosts + recruitWorkerCosts;
  const workerTokens = PlayersSelector.getNumWorkerTokens(G.players, playerID);
  if (workerTokens < totalWorkerCosts) {
    return INVALID_MOVE;
  }
  PlayersMutator.useWorkerTokens(G.players, playerID, createProjectWorkerCosts);

  console.log('use project card')
  // check project card in in hand
  const currentHandProjects = G.players[playerID].hand.projects;
  if (!isInRange(projectCardIndex, currentHandProjects.length)) {
    return INVALID_MOVE;
  }
  const projectCard = CardsSelector.getById(currentHandProjects, projectCardIndex);
  PlayersMutator.useProject(G.players, playerID, projectCard);
  ProjectBoardMutator.add(G.table.projectBoard, projectCard);

  // assign worker token to owner slot
  const projectSlot = ProjectBoardSelector.getLast(G.table.projectBoard);
  ProjectSlotMutator.assignOwner(projectSlot, playerID, createProjectWorkerCosts);

  console.log('use job card')
  // check job card is on the table
  const currentJobs = G.table.jobSlots;
  if (!isInRange(jobCardIndex, currentJobs.length)) {
    return INVALID_MOVE;
  }

  // check job card is required in project
  const jobCard = CardsSelector.getById(currentJobs, jobCardIndex);
  if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
    return INVALID_MOVE;
  }
  JobSlotsMutator.removeJobCard(currentJobs, jobCard);
  // assign worker token to job slot
  PlayersMutator.useWorkerTokens(G.players, playerID, recruitWorkerCosts);
  const jobInitPoints = 1;
  ProjectSlotMutator.assignWorker(projectSlot, jobCard.name, playerID, jobInitPoints);

  const createProjectVictoryPoints = 2;
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, createProjectVictoryPoints);

  console.log('discard and refill job card')
  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 6;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(currentJobs, jobCards);

  console.log('end create project')
  // end stage if no action tokens left
  if (PlayersSelector.getNumActionTokens(G.players, playerID) === 0) {
    events.endStage();
  }
};
