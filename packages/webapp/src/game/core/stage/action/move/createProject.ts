import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleSelector } from '@/game/store/slice/rule';

export type CreateProject = (projectCardId: string, jobCardId: string) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardId, jobCardId) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'createProject')) {
    throw new Error('Action slot not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.createProject)) {
    throw new Error('Action slot is occupied');
  }

  console.log('use action tokens')
  // TODO: replace hardcoded number with dynamic rules
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'createProject');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    throw new Error('Not enough action tokens');
  }
  ActionSlotMutator.occupy(G.table.actionSlots.createProject);

  console.log('use worker tokens')
  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  PlayersMutator.useWorkerTokens(G.players, playerID, projectOwnerWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    throw new Error('Not enough worker tokens');
  }

  console.log('use project card')
  // check project card in in hand
  const projectCard = PlayersSelector.getProjectCardById(G.players, playerID, projectCardId);
  if (!projectCard) {
    throw new Error('Project card not found');
  }
  PlayersMutator.useProject(G.players, playerID, projectCard);
  ProjectBoardMutator.add(G.table.projectBoard, projectCard);

  // assign worker token to owner slot
  const projectSlot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, projectCard);
  ProjectSlotMutator.assignOwner(projectSlot, playerID, projectOwnerWorkerTokenCosts);

  console.log('use job card')
  // check job card is on the table
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId);
  if (!jobCard) {
    throw new Error('Job card not found');
  }

  // remove and discard job card
  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  // check job card is required in project
  if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
    throw new Error('Job card is not required in project');
  }

  // assign worker token to job slot
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < 0) {
    throw new Error('Not enough worker tokens');
  }
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'createProject');
  ProjectSlotMutator.assignWorker(projectSlot, jobCard.name, playerID, initialContributionValue);

  console.log('refill job card')
  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);

  console.log('score victory points')
  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'createProject');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

  console.log('end create project')
};
