import { completionReward } from '@/game/standard/config';
import type { Ctx, PlayerID } from 'boardgame.io';
import type { ClientGameState } from '@/game/store/store';
import type { JobCard, ProjectCard } from '@/game/card';
import type { ContributionAction } from '@/game/core/ContributionAction';
import type { ActionExecutionOptions } from '@/game/core/stage/action/validate';
import type { ChoiceTarget } from '@/game/standard/engine';
import type { NodeId } from '@/game/standard/state';
import { hasNode, NODES, predecessors, REWARDS, THRESHOLDS } from '@/game/standard/tree';
import type { ProjectSlot } from '@/game/store/slice/projectSlot/projectSlot';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { RuleSelector } from '@/game/store/slice/rule';
import type { Profile } from './profiles';
import type { BotAction } from './types';

/** Everything a scorer needs about the position, derived once per decision. */
export interface Position {
  view: ClientGameState;
  ctx: Ctx;
  me: PlayerID;
  profile: Profile;
  /** Rounds still to be played, counting the current one. */
  roundsLeft: number;
  apCost: number;
}

interface Change {
  jobName: string;
  worker: PlayerID;
  value: number;
}

export function position(view: ClientGameState, ctx: Ctx, me: PlayerID, profile: Profile): Position {
  const totalRounds = view.rules.numNonEndGameEventCards + 1;
  const roundsLeft = Math.max(1, totalRounds - (view.standard?.round ?? 0) + 1);
  const apCost = Math.max(profile.weights.apCost, view.rules.settlement.leftoverActionTokensVictoryPoints);
  return { view, ctx, me, profile, roundsLeft, apCost };
}

const isComplete = (slot: ProjectSlot) =>
  Object.entries(slot.card!.requirements).every(([job, need]) => ProjectSlotSelector.getJobContribution(slot, job) >= need);

const filledShare = (slot: ProjectSlot) => {
  const entries = Object.entries(slot.card!.requirements);
  const need = entries.reduce((sum, [, n]) => sum + n, 0);
  const have = entries.reduce((sum, [job, n]) => sum + Math.min(n, ProjectSlotSelector.getJobContribution(slot, job)), 0);
  return need ? have / need : 1;
};

/** Expected points `me` gets from a project: settled value if it completes, half-value at game end if not. */
function projectValue(p: Position, slot: ProjectSlot): number {
  const mine = ProjectSlotSelector.getPlayerContribution(slot, p.me);
  if (isComplete(slot)) return mine + (slot.owner === p.me ? ownerBonus(p, slot) : 0);
  const horizon = p.roundsLeft >= 3 ? 1 : p.roundsLeft === 2 ? 0.75 : 0.4;
  const base = p.profile.weights.baseCompletionChance;
  const chance = Math.min(0.95, (base + (1 - base) * filledShare(slot)) * horizon);
  const stake = mine + (slot.owner === p.me ? ownerBonus(p, slot) : 0);
  return chance * stake + (1 - chance) * 0.5 * mine;
}

const ownerBonus = (p: Position, slot: ProjectSlot) => completionReward(p.view.standard?.experiments, slot.card!.difficulty, p.view.rules.settlement.projectOwnerVictoryPoints) + (p.view.rules.event?.extraOwnerVictoryPoints ?? 0);

function applyChanges(slot: ProjectSlot, changes: Change[]): ProjectSlot {
  const next: ProjectSlot = { ...slot, contributions: slot.contributions.map(c => ({ ...c })) };
  for (const { jobName, worker, value } of changes) {
    const cube = next.contributions.find(c => c.jobName === jobName && c.worker === worker);
    if (cube) cube.value += value;
    else next.contributions.push({ jobName, worker, value });
    next.lastContributor = worker;
  }
  return next;
}

/** Change in `me`'s expected points from adding cubes/points to one project. */
function projectDelta(p: Position, before: ProjectSlot | undefined, after: ProjectSlot): number {
  const w = p.profile.weights;
  let delta = projectValue(p, after) - (before ? projectValue(p, before) : 0);
  if (isComplete(after) && !(before && isComplete(before))) {
    if (after.lastContributor === p.me) delta += completionReward(p.view.standard?.experiments, after.card!.difficulty, p.view.rules.settlement.lastContributorVictoryPoints);
    const returned = after.contributions.filter(c => c.worker === p.me).length + (after.owner === p.me ? after.ownerToken : 0);
    delta += returned * w.workerToken;
    delta += w.villageCompletion * (0.5 + 0.5 * w.village);
  }
  return delta * w.points;
}

const slotById = (p: Position, slotId: string) => p.view.table.projectBoard.find(s => s.id === slotId && s.card);
const slotByProject = (p: Position, projectId: string) => p.view.table.projectBoard.find(s => s.card?.id === projectId);
const remaining = (slot: ProjectSlot, jobName: string) => slot.card!.requirements[jobName] - ProjectSlotSelector.getJobContribution(slot, jobName);
const overtimeCost = (p: Position, options?: ActionExecutionOptions) => (options?.useOvertime ? p.profile.weights.overtime : 0);

/** Value of a tree node: its reward, the consequence of its ability for the rest of the game, and what it unlocks. */
export function nodeValue(p: Position, node: NodeId): number {
  const w = p.profile.weights;
  const tier = Number(node.split('-')[1]);
  const beneficiaries = 1 + w.village * (p.ctx.numPlayers - 1);
  const consequence = p.profile.nodeImpact[node] * Math.max(0, p.roundsLeft - 0.5) * beneficiaries * w.pointsPerAP;
  const grown = p.view.standard?.grown ?? [];
  const completed = p.view.standard?.completedProjectIds.length ?? 0;
  const unlock = tier === 5 ? 0 : NODES
    .filter(next => predecessors(next).includes(node) && !grown.includes(next) && !predecessors(next).some(n => grown.includes(n)))
    .reduce((sum, next) => sum + REWARDS[tier] * (completed >= THRESHOLDS[tier] ? 1 : 0.5), 0) * w.unlock;
  return (REWARDS[tier - 1] * w.points + consequence + unlock) * w.tree;
}

/** Value of `me` placing a new cube via recruit, Government 4 or the extra recruit. */
function recruitValue(p: Position, slot: ProjectSlot, jobName: string): number {
  const w = p.profile.weights;
  const value = Math.min(p.view.rules.action.recruit.initialContributionValue, remaining(slot, jobName));
  return projectDelta(p, slot, applyChanges(slot, [{ jobName, worker: p.me, value }])) + w.presence - w.workerToken;
}

function neededJobs(p: Position): Set<string> {
  const hand = p.view.players[p.me].hand?.projects ?? [];
  return new Set([
    ...hand.flatMap(card => Object.keys(card.requirements)),
    ...p.view.table.projectBoard.flatMap(slot => (slot.card ? Object.keys(slot.card.requirements) : [])),
  ]);
}

function contributionValue(p: Position, contributions: ContributionAction[]): number {
  const bySlot = new Map<string, Change[]>();
  for (const c of contributions) bySlot.set(c.projectSlotId, [...(bySlot.get(c.projectSlotId) ?? []), { jobName: c.jobName, worker: p.me, value: c.value }]);
  let total = 0;
  for (const [slotId, changes] of Array.from(bySlot)) {
    const slot = slotById(p, slotId);
    if (slot) total += projectDelta(p, slot, applyChanges(slot, changes));
  }
  return total;
}

function choiceValue(p: Position, target: ChoiceTarget | null): number {
  const choice = p.view.standard!.choices[0];
  const w = p.profile.weights;
  if (target === null) return 0;
  if (choice.kind === 'draw') return target.pile === 'advanced' ? w.advancedDraw : 0;
  if (choice.kind === 'discard') {
    const card = p.view.players[p.me].hand?.projects.find(c => c.id === target.cardId);
    if (!card) return 0;
    const market = new Set(p.view.table.jobSlots.map(j => j.name));
    const playable = Object.keys(card.requirements).some(job => market.has(job));
    return (card.difficulty - 2) * 0.5 + (playable ? 0 : 0.5);
  }
  const slot = slotByProject(p, target.projectId);
  if (!slot || !target.jobName) return 0;
  if (choice.kind === 'government4' || choice.kind === 'extraRecruit') return recruitValue(p, slot, target.jobName);
  // Government 5 may spend a reserve token to create the player's first cube here.
  const newCubeCost = choice.kind === 'government5' && !ProjectSlotSelector.hasWorker(slot, target.jobName, p.me) ? w.workerToken : 0;
  return projectDelta(p, slot, applyChanges(slot, [{ jobName: target.jobName, worker: target.worker!, value: 1 }])) - newCubeCost;
}

/** Score of one legal action from `me`'s point of view; ending the turn scores 0. */
export function scoreAction(p: Position, action: BotAction): number {
  const w = p.profile.weights;
  const { view, me } = p;
  switch (action.move) {
    case 'endActionTurn':
      return 0;
    case 'growTree': {
      const [node, overtime] = action.args as [NodeId, boolean];
      return nodeValue(p, node) - p.apCost - (overtime ? w.overtime : 0);
    }
    case 'createProject': {
      const [projectId, jobId, target, options] = action.args as [string, string, string | undefined, ActionExecutionOptions | undefined];
      const card = view.players[me].hand?.projects.find((c: ProjectCard) => c.id === projectId);
      const job = view.table.jobSlots.find((j: JobCard) => j.id === jobId);
      if (!card || !job) return -Infinity;
      const jobName = Object.keys(card.requirements).includes(job.name) ? job.name : target!;
      const start = hasNode(view, 'source-3') && job.name === '工程師' ? 3 : view.rules.action.createProject.initialContributionValue;
      const ownerTokens = view.rules.action.createProject.projectOwnerWorkerCost;
      const slot: ProjectSlot = { id: 'new', card, owner: me, ownerToken: ownerTokens, contributions: [], lastContributor: me };
      const after = applyChanges(slot, [{ jobName, worker: me, value: Math.min(start, card.requirements[jobName]) }]);
      const cost = RuleSelector.getActionTokenCost(view.rules, 'createProject');
      const workers = ownerTokens + view.rules.action.createProject.assignWorkerCost;
      return view.rules.action.createProject.victoryPoints * w.points + w.initiation + projectDelta(p, undefined, after) + w.presence
        - workers * w.workerToken - cost * p.apCost - overtimeCost(p, options);
    }
    case 'recruit': {
      const [jobId, slotId, target, options] = action.args as [string, string, string | undefined, ActionExecutionOptions | undefined];
      const slot = slotById(p, slotId);
      const job = view.table.jobSlots.find(j => j.id === jobId);
      if (!slot || !job) return -Infinity;
      return recruitValue(p, slot, target ?? job.name) - p.apCost - overtimeCost(p, options);
    }
    case 'contributeOwnedProjects':
    case 'contributeJoinedProjects': {
      const [contributions, options] = action.args as [ContributionAction[], ActionExecutionOptions | undefined];
      return contributionValue(p, contributions) - p.apCost - overtimeCost(p, options);
    }
    case 'removeAndRefillJobs': {
      const [ids, options] = action.args as [string[], ActionExecutionOptions | undefined];
      const needed = neededJobs(p);
      const lost = view.table.jobSlots.filter(j => ids.includes(j.id) && needed.has(j.name)).length;
      return view.rules.action.removeAndRefillJobs.victoryPoints * w.points - lost * w.marketLoss - p.apCost - overtimeCost(p, options);
    }
    case 'discardExcessJobCards': {
      const [ids] = action.args as [string[]];
      const needed = neededJobs(p);
      return -view.table.jobSlots.filter(j => ids.includes(j.id) && needed.has(j.name)).length * w.marketLoss;
    }
    case 'resolveStandardChoice':
      return choiceValue(p, action.args[1] as ChoiceTarget | null);
    default:
      return -Infinity;
  }
}
