import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { GameMove } from '@/game/core/type';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsMutator, JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { ActionExecutionOptions, ActionValidationError, validateCreateProject } from '@/game/core/stage/action/validate';
import { applyActionCost } from './applyActionCost';

export type CreateProject = (
  projectCardId: string,
  jobCardId: string,
  assignedJobName?: string,
  options?: ActionExecutionOptions,
) => void;

export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardId, jobCardId, assignedJobName, options) => {
  // Shared validation: same predicates the client preflight runs. Whether
  // assignedJobName may override the requirement is derived from
  // authoritative event state inside the validator.
  const result = validateCreateProject(G, playerID, projectCardId, jobCardId, assignedJobName, options);
  if (!result.valid) {
    throw new ActionValidationError(result);
  }

  const projectOwnerWorkerTokenCosts = RuleSelector.getProjectOwnerWorkerTokenCost(G.rules, 'createProject');
  const assignWorkerTokenCosts = RuleSelector.getAssignWorkerTokenCost(G.rules, 'createProject');
  const projectCard = PlayersSelector.getProjectCardById(G.players, playerID, projectCardId)!;
  const jobCard = JobSlotsSelector.getJobCardById(G.table.jobSlots, jobCardId)!;
  const ignoreRequirement = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);

  // All checks passed — now mutate state
  applyActionCost(G, playerID, 'createProject', options);
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
  // 斜槓青年: a mismatched card records its contribution under the
  // player-chosen required position, never under an unrequired profession.
  const matchesRequirement = Object.keys(projectCard.requirements).includes(jobCard.name);
  const effectiveJobName = matchesRequirement ? jobCard.name : assignedJobName!;
  ProjectSlotMutator.assignWorker(projectSlot, effectiveJobName, playerID, initialContributionValue);

  // Refill job card
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobSlots - G.table.jobSlots.length;
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);

  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'createProject');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

};
