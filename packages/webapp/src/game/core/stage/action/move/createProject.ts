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
import { RuleSelector } from '@/game/store/slice/rule';

export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID, events }, projectCardIndex, jobCardIndex) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'createProject')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.createProject)) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  // TODO: replace hardcoded number with dynamic rules
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'createProject');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.createProject);

  console.log('use worker tokens')
  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  PlayersMutator.useWorkerTokens(G.players, playerID, projectOwnerWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }

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
  const projectSlot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, projectCard);
  ProjectSlotMutator.assignOwner(projectSlot, playerID, projectOwnerWorkerTokenCosts);

  console.log('use job card')
  // check job card is on the table
  if (!isInRange(jobCardIndex, G.table.jobSlots.length)) {
    return INVALID_MOVE;
  }

  // check job card is required in project
  const jobCard = CardsSelector.getById(G.table.jobSlots, jobCardIndex);
  if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
    return INVALID_MOVE;
  }
  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  // assign worker token to job slot
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'createProject');
  ProjectSlotMutator.assignWorker(projectSlot, jobCard.name, playerID, initialContributionValue);

  console.log('discard and refill job card')
  // discard job card
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(G.table.jobSlots, jobCards);

  console.log('score victory points')
  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'createProject');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

  console.log('end create project')
  // end stage if no action tokens left
  if (PlayersSelector.getNumActionTokens(G.players, playerID) === 0) {
    events.endStage();
    return;
  }
};
