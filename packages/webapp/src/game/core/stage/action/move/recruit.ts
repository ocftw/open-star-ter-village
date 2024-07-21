import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';

export type Recruit = (jobCardId: string, projectSlotId: string) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardId, projectSlotId) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'recruit')) {
    throw new Error('Action slot not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.recruit)) {
    throw new Error('Action slot is occupied');
  }

  console.log('use action tokens')
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'recruit');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    throw new Error('Not enough action tokens');
  }
  ActionSlotMutator.occupy(G.table.actionSlots.recruit);

  console.log('use job card')
  // check job card is on the table
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId);
  if (!jobCard) {
    throw new Error('Job card not found');
  }

  const activeProject = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
  if (!activeProject) {
    throw new Error('Project slot not found');
  }

  // User cannot place more than one worker in same job
  if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, playerID)) {
    throw new Error('Worker already assigned');
  }

  // remove and discard job card
  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobCard.name);
  // Check job requirment is not fulfilled yet
  if (jobContribution >= activeProject.card!.requirements[jobCard.name]) {
    throw new Error('Job requirement already fulfilled');
  }

  console.log('use worker tokens')
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    throw new Error('Not enough worker tokens');
  }

  // assign worker token
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);
};
