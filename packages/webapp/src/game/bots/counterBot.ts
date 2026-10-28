import { completionReward } from '@/game/standard/config';
import type { PlayerID } from 'boardgame.io';
import type { ContributionAction } from '@/game/core/ContributionAction';
import type { ActionExecutionOptions } from '@/game/core/stage/action/validate';
import type { ChoiceTarget } from '@/game/standard/engine';
import type { ClientGameState } from '@/game/store/store';
import type { ProjectSlot } from '@/game/store/slice/projectSlot/projectSlot';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { RuleSelector } from '@/game/store/slice/rule';
import { enumerate } from './enumerate';
import { position, scoreAction, type Position } from './evaluate';
import { COUNTER, type Profile } from './profiles';
import type { Bot, BotAction } from './types';

/** Share of a finisher reward the bot gives up when it leaves a project others can finish first. */
export const EXPOSURE_WEIGHT = 1;

export interface CounterOptions {
  profile?: Profile;
  exposureWeight?: number;
}

interface Change { jobName: string; worker: PlayerID; value: number }

const remaining = (slot: ProjectSlot, job: string) => Math.max(0, slot.card!.requirements[job] - ProjectSlotSelector.getJobContribution(slot, job));
const missingJobs = (slot: ProjectSlot) => Object.keys(slot.card!.requirements).filter(job => remaining(slot, job) > 0);

function applyChanges(slot: ProjectSlot, changes: Change[]): ProjectSlot {
  const next: ProjectSlot = { ...slot, contributions: slot.contributions.map(c => ({ ...c })) };
  for (const { jobName, worker, value } of changes) {
    const cube = next.contributions.find(c => c.jobName === jobName && c.worker === worker);
    if (cube) cube.value += value;
    else next.contributions.push({ jobName, worker, value });
  }
  return next;
}

/**
 * Whether another player could complete the project before `me` acts again:
 * every missing position must be reachable by some other player, either by
 * contributing with a cube they already have or by recruiting from the market,
 * within one turn's contribution budget.
 */
export function exposedToOthers(view: ClientGameState, me: PlayerID, slot: ProjectSlot): boolean {
  const missing = missingJobs(slot);
  if (missing.length === 0) return false;
  const market = new Set(view.table.jobSlots.map(card => card.name));
  const budget = RuleSelector.getMaxContributionValue(view.rules, 'contributeJoinedProjects');
  const recruitValue = view.rules.action.recruit.initialContributionValue;
  return Object.keys(view.players).filter(id => id !== me).some(other => {
    let contributeNeed = 0;
    let recruits = 0;
    for (const job of missing) {
      if (ProjectSlotSelector.hasWorker(slot, job, other)) contributeNeed += remaining(slot, job);
      else if (market.has(job) && remaining(slot, job) <= recruitValue) recruits++;
      else return false;
    }
    // One contribute action and up to two recruits (one plus overtime) in a turn.
    return contributeNeed <= budget && recruits <= 2;
  });
}

/**
 * Whether `me` can still complete the project later this turn with one
 * contribute action, after `action` has spent its AP, slot and overtime token.
 */
function canFinishThisTurn(view: ClientGameState, me: PlayerID, slot: ProjectSlot, action: BotAction, apCost: number): boolean {
  const options = action.args.find(arg => typeof arg === 'object' && arg !== null && 'useOvertime' in arg) as ActionExecutionOptions | undefined;
  if (view.players[me].token.actions - apCost < 1) return false;
  const missing = missingJobs(slot);
  if (!missing.every(job => ProjectSlotSelector.hasWorker(slot, job, me))) return false;
  const finish = slot.owner === me ? 'contributeOwnedProjects' : 'contributeJoinedProjects';
  const occupied = ActionSlotSelector.isOccupied(view.table.actionSlots[finish]) || (action.move === finish && !options?.useOvertime);
  const overtime = (view.players[me].token.overtime ?? 0) - (options?.useOvertime ? 1 : 0);
  const need = missing.reduce((sum, job) => sum + remaining(slot, job), 0);
  return (!occupied || overtime > 0) && need <= RuleSelector.getMaxContributionValue(view.rules, finish);
}

/** The project slots an action changes, before and after, from `me`'s view. */
function affectedSlots(p: Position, action: BotAction): { before?: ProjectSlot; after: ProjectSlot; apCost: number }[] {
  const { view, me } = p;
  const board = view.table.projectBoard;
  if (action.move === 'contributeOwnedProjects' || action.move === 'contributeJoinedProjects') {
    const [contributions] = action.args as [ContributionAction[], ActionExecutionOptions | undefined];
    const bySlot = new Map<string, Change[]>();
    for (const c of contributions) bySlot.set(c.projectSlotId, [...(bySlot.get(c.projectSlotId) ?? []), { jobName: c.jobName, worker: me, value: c.value }]);
    return Array.from(bySlot).flatMap(([id, changes]) => {
      const slot = board.find(s => s.id === id && s.card);
      return slot ? [{ before: slot, after: applyChanges(slot, changes), apCost: RuleSelector.getActionTokenCost(view.rules, action.move as 'contributeOwnedProjects') }] : [];
    });
  }
  if (action.move === 'recruit') {
    const [jobId, slotId, target] = action.args as [string, string, string | undefined];
    const slot = board.find(s => s.id === slotId && s.card);
    const job = view.table.jobSlots.find(j => j.id === jobId);
    if (!slot || !job) return [];
    const jobName = target ?? job.name;
    const value = Math.min(view.rules.action.recruit.initialContributionValue, remaining(slot, jobName));
    return [{ before: slot, after: applyChanges(slot, [{ jobName, worker: me, value }]), apCost: RuleSelector.getActionTokenCost(view.rules, 'recruit') }];
  }
  if (action.move === 'resolveStandardChoice') {
    const target = action.args[1] as ChoiceTarget | null;
    const choice = view.standard?.choices[0];
    const slot = target?.jobName ? board.find(s => s.card?.id === target.projectId) : undefined;
    if (!choice || !target?.jobName || !slot) return [];
    const recruit = choice.kind === 'government4' || choice.kind === 'extraRecruit';
    const value = recruit ? Math.min(view.rules.action.recruit.initialContributionValue, remaining(slot, target.jobName)) : 1;
    return [{ before: slot, after: applyChanges(slot, [{ jobName: target.jobName, worker: recruit ? me : target.worker!, value }]), apCost: 0 }];
  }
  return [];
}

/** Finisher reward the bot expects to hand to another player because of this action. */
export function exposurePenalty(p: Position, action: BotAction, exposureWeight = EXPOSURE_WEIGHT): number {
  const { view, me } = p;
  let penalty = 0;
  for (const { before, after, apCost } of affectedSlots(p, action)) {
    if (missingJobs(after).length === 0) continue;
    const exposedAfter = exposedToOthers(view, me, after) && !canFinishThisTurn(view, me, after, action, apCost);
    const exposedBefore = before ? exposedToOthers(view, me, before) : false;
    if (exposedAfter && !exposedBefore) {
      penalty += exposureWeight * completionReward(view.standard?.experiments, after.card!.difficulty, view.rules.settlement.lastContributorVictoryPoints);
    }
  }
  return penalty;
}

/**
 * Counter: Balanced's one-ply scoring with Counter's weights, minus the
 * finisher reward it would hand to the players who act before its next turn.
 * Built to win from the early seats, where Balanced loses to later players.
 */
export function createCounterBot({ profile = COUNTER, exposureWeight = EXPOSURE_WEIGHT }: CounterOptions = {}): Bot {
  return {
    name: profile.name,
    decide({ view, ctx, playerID, random }) {
      const actions = enumerate(view, ctx, playerID);
      if (actions.length === 0) throw new Error(`No legal action for player ${playerID}`);
      const p = position(view, ctx, playerID, profile);
      let best: BotAction[] = [];
      let bestScore = -Infinity;
      for (const action of actions) {
        const score = scoreAction(p, action) - exposurePenalty(p, action, exposureWeight);
        if (score > bestScore + 1e-9) {
          best = [action];
          bestScore = score;
        } else if (Math.abs(score - bestScore) <= 1e-9) {
          best.push(action);
        }
      }
      return best[Math.floor(random() * best.length)];
    },
  };
}
