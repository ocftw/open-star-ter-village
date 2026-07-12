import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { ActionValidationError, validateCreateProject } from '@/game/core/stage/action/validate';

export type CreateProject = (projectCardId: string, jobCardId: string) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardId, jobCardId) => {
  // Shared validation: same predicates the client preflight runs.
  const result = validateCreateProject(G, playerID, projectCardId, jobCardId);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'createProject');
  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  const projectCard = PlayersSelector.getProjectCardById(G.players, playerID, projectCardId)!;
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId)!;
  const ignoreRequirement = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);

  // All checks passed — now mutate state
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  ActionSlotMutator.occupy(G.table.actionSlots.createProject);
  PlayersMutator.useWorkerTokens(G.players, playerID, projectOwnerWorkerTokenCosts);

  PlayersMutator.useProject(G.players, playerID, projectCard);
  ProjectBoardMutator.add(G.table.projectBoard, projectCard);

  const projectSlot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, projectCard);
  ProjectSlotMutator.assignOwner(projectSlot, playerID, projectOwnerWorkerTokenCosts);

  JobSlotsMutator.removeJobCard(G.table.jobSlots, jobCard);
  DeckMutator.discard(G.decks.jobs, [jobCard]);

  if (ignoreRequirement) {
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
  }

  PlayersMutator.useWorkerTokens(G.players, playerID, assignWorkerTokenCosts);
  const initialContributionValue = RuleSelector.getAssignWorkerInitialContributionValue(G.rules, 'createProject');
  ProjectSlotMutator.assignWorker(projectSlot, jobCard.name, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);

  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'createProject');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

};
