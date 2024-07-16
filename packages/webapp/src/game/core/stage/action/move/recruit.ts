import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { CardsMutator, CardsSelector } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';

export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID, events }, jobCardIndex, activeProjectIndex) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'recruit')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.recruit)) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'recruit');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.recruit);

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
  if (jobContribution >= activeProject.card!.requirements[jobCard.name]) {
    return INVALID_MOVE;
  }
  // User cannot place more than one worker in same job
  if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, playerID)) {
    return INVALID_MOVE;
  }

  console.log('use worker tokens')
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }

  // assign worker token
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, playerID, initialContributionValue);

  // discard job card
  CardsMutator.removeOne(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  CardsMutator.add(G.table.jobSlots, jobCards);
};
