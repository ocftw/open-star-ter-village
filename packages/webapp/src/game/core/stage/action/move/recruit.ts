import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator, ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';

export type Recruit = (jobCardId: string, projectSlotId: string) => void;

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardId, projectSlotId) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'recruit')) {
    throw new Error('Action slot not available');
  }
  if (ActionSlotSelector.isOccupied(G.table.actionSlots.recruit)) {
    throw new Error('Action slot is occupied');
  }

  // Validate token balances before mutating state
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'recruit');
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < actionTokenCosts) {
    throw new Error('Not enough action tokens');
  }
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'recruit');
  if (PlayersSelector.getNumWorkerTokens(G.players, playerID) < assignWorkerTokenCosts) {
    throw new Error('Not enough worker tokens');
  }

  // Validate job card is on the table
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId);
  if (!jobCard) {
    throw new Error('Job card not found');
  }

  // Validate project slot exists
  const activeProject = ProjectBoardSelector.getBySlotId(G.table.projectBoard, projectSlotId);
  if (!activeProject) {
    throw new Error('Project slot not found');
  }

  // Validate no duplicate worker in same job
  if (ProjectSlotSelector.hasWorker(activeProject, jobCard.name, playerID)) {
    throw new Error('Worker already assigned');
  }

  // Validate job card is required in project
  const ignoreRequirement = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);
  if (!ignoreRequirement && !Object.keys(activeProject.card!.requirements).includes(jobCard.name)) {
    throw new Error('Job card is not required in project');
  }

  // Validate job requirement is not fulfilled yet
  const jobContribution = ProjectSlotSelector.getJobContribution(activeProject, jobCard.name);
  if (jobContribution >= activeProject.card!.requirements[jobCard.name]) {
    throw new Error('Job requirement already fulfilled');
  }

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.recruit);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  if (ignoreRequirement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);

  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'recruit');
  ProjectSlotMutator.assignWorker(activeProject, jobCard.name, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);
};
