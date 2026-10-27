import type { Ctx, PlayerID } from 'boardgame.io';
import type { ClientGameState } from '@/game/store/store';
import type { JobCard } from '@/game/card';
import type { ContributionAction } from '@/game/core/ContributionAction';
import type { ActionExecutionOptions } from '@/game/core/stage/action/validate';
import {
  validateContributeJoinedProjects,
  validateContributeOwnedProjects,
  validateCreateProject,
  validateDiscardExcessJobCards,
  validateRecruit,
  validateRemoveAndRefillJobs,
} from '@/game/core/stage/action/validate';
import { choiceOptions } from '@/game/standard/engine';
import { growthReason, hasNode, NODES } from '@/game/standard/tree';
import { RuleSelector } from '@/game/store/slice/rule';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import type { BotAction } from './types';

const EXECUTIONS: (ActionExecutionOptions | undefined)[] = [undefined, { useOvertime: true }];

/** One job card per profession: cards with the same name are interchangeable. */
const distinctJobCards = (jobSlots: JobCard[]): JobCard[] =>
  jobSlots.filter((card, index) => jobSlots.findIndex(other => other.name === card.name) === index);

/** Curated contribution payloads: +1, fill one position, or spread the budget, instead of every combination. */
const contributionCandidates = (view: ClientGameState, playerID: PlayerID, owned: boolean): ContributionAction[][] => {
  const action = owned ? 'contributeOwnedProjects' : 'contributeJoinedProjects';
  const budget = RuleSelector.getMaxContributionValue(view.rules, action);
  const targets = view.table.projectBoard
    .filter(slot => slot.card && (slot.owner === playerID) === owned)
    .flatMap(slot => slot.contributions
      .filter(cube => cube.worker === playerID)
      .map(cube => ({
        projectSlotId: slot.id,
        jobName: cube.jobName,
        remaining: slot.card!.requirements[cube.jobName] - ProjectSlotSelector.getJobContribution(slot, cube.jobName),
      })))
    .filter(target => target.remaining > 0);

  const candidates: ContributionAction[][] = [];
  for (const { projectSlotId, jobName, remaining } of targets) {
    const full = Math.min(remaining, budget);
    for (const value of full > 1 ? [1, full] : [1]) candidates.push([{ projectSlotId, jobName, value }]);
  }
  // Spread the budget over the positions closest to completion.
  let left = budget;
  const spread: ContributionAction[] = [];
  for (const { projectSlotId, jobName, remaining } of [...targets].sort((a, b) => a.remaining - b.remaining)) {
    if (left <= 0) break;
    const value = Math.min(remaining, left);
    spread.push({ projectSlotId, jobName, value });
    left -= value;
  }
  if (spread.length > 1) candidates.push(spread);
  return candidates;
};

const actionStageMoves = (view: ClientGameState, ctx: Ctx, playerID: PlayerID): BotAction[] => {
  const actions: BotAction[] = [];
  const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
  const pendingDiscards = view.table.fourFreedomsPendingDiscards.length > 0;
  if (isLastPlayer && pendingDiscards && (view.table.actionPhaseDone || view.players[playerID].token.actions <= 0)) {
    const ids = view.table.jobSlots.map(card => card.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (validateDiscardExcessJobCards(view, [ids[i], ids[j]]).valid) {
          actions.push({ move: 'discardExcessJobCards', args: [[ids[i], ids[j]]] });
        }
      }
    }
    return actions;
  }

  for (const node of NODES) {
    for (const overtime of [false, true]) {
      if (!growthReason(view, node, playerID, overtime)) actions.push({ move: 'growTree', args: [node, overtime] });
    }
  }

  const jobCards = distinctJobCards(view.table.jobSlots);
  const hand = view.players[playerID].hand?.projects ?? [];
  const wildcardCreate = RuleSelector.canIgnoreFirstWorkerRequirement(view.rules, playerID) || hasNode(view, 'data-5');
  for (const options of EXECUTIONS) {
    for (const project of hand) {
      for (const job of jobCards) {
        const matches = Object.keys(project.requirements).includes(job.name);
        const targets = matches || !wildcardCreate ? [undefined] : Object.keys(project.requirements);
        for (const target of targets) {
          if (validateCreateProject(view, playerID, project.id, job.id, target, options).valid) {
            actions.push({ move: 'createProject', args: [project.id, job.id, target, options] });
          }
        }
      }
    }
  }

  const wildcardRecruit = RuleSelector.canIgnoreFirstWorkerRequirement(view.rules, playerID);
  for (const options of EXECUTIONS) {
    for (const slot of view.table.projectBoard) {
      if (!slot.card) continue;
      for (const job of jobCards) {
        const targets = wildcardRecruit ? [undefined, ...Object.keys(slot.card.requirements)] : [undefined];
        for (const target of targets) {
          if (validateRecruit(view, playerID, job.id, slot.id, target, options).valid) {
            actions.push({ move: 'recruit', args: [job.id, slot.id, target, options] });
          }
        }
      }
    }
  }

  for (const owned of [true, false]) {
    const move = owned ? 'contributeOwnedProjects' : 'contributeJoinedProjects';
    const validate = owned ? validateContributeOwnedProjects : validateContributeJoinedProjects;
    for (const contributions of contributionCandidates(view, playerID, owned)) {
      for (const options of EXECUTIONS) {
        if (validate(view, playerID, contributions, options).valid) actions.push({ move, args: [contributions, options] });
      }
    }
  }

  const neededJobs = new Set([
    ...hand.flatMap(project => Object.keys(project.requirements)),
    ...view.table.projectBoard.flatMap(slot => (slot.card ? Object.keys(slot.card.requirements) : [])),
  ]);
  const unneeded = view.table.jobSlots.filter(card => !neededJobs.has(card.name)).map(card => card.id);
  const refills = [view.table.jobSlots.map(card => card.id), ...(unneeded.length ? [unneeded] : [])];
  for (const ids of refills) {
    for (const options of EXECUTIONS) {
      if (validateRemoveAndRefillJobs(view, playerID, ids, options).valid) actions.push({ move: 'removeAndRefillJobs', args: [ids, options] });
    }
  }

  actions.push({ move: 'endActionTurn', args: [] });
  return actions;
};

/**
 * Legal moves for `playerID`, computed from that player's view only: every
 * growth, start, recruit and choice, plus a curated set of contributions and
 * market refills.
 * Each candidate passes the same validators the UI preflight uses, so a bot
 * choosing any of them should never be rejected by the server.
 */
export function enumerate(view: ClientGameState, ctx: Ctx, playerID: PlayerID): BotAction[] {
  if (ctx.gameover || !view.standard) return [];
  const stage = ctx.activePlayers?.[playerID];
  const choice = view.standard.choices[0];
  if (stage === 'standardChoice') {
    if (!choice || choice.playerId !== playerID) return [];
    const actions: BotAction[] = choiceOptions(view, choice).map(option => ({ move: 'resolveStandardChoice', args: [choice.id, option.target] }));
    if (choice.kind !== 'draw') actions.push({ move: 'resolveStandardChoice', args: [choice.id, null] });
    return actions;
  }
  if (stage === 'action' && ctx.currentPlayer === playerID) return actionStageMoves(view, ctx, playerID);
  return [];
}
