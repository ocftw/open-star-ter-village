import { completionReward } from '@/game/standard/config';
import type { Ctx, PlayerID } from 'boardgame.io';
import type { ClientGameState } from '@/game/store/store';
import type { JobCard, ProjectCard } from '@/game/card';
import type { ContributionAction } from '@/game/core/ContributionAction';
import type { ActionExecutionOptions } from '@/game/core/stage/action/validate';
import type { ChoiceTarget } from '@/game/standard/engine';
import type { NodeId } from '@/game/standard/state';
import { advancedScoreGate, hasNode, isConnected, mainJobs, nodesConnectedBy, REWARDS, treeProgress, treeRules } from '@/game/standard/tree';
import type { ProjectSlot } from '@/game/store/slice/projectSlot/projectSlot';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { RuleSelector } from '@/game/store/slice/rule';
import { V2_NODE_IMPACT, type Profile } from './profiles';
import type { BotAction } from './types';
import rawProjectCards from '@/game/data/card/projects.json';

type CardSpec = Pick<ProjectCard, 'name' | 'difficulty' | 'requirements'>;
const PROJECT_CARDS = rawProjectCards as unknown as CardSpec[];

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
function projectValue(p: Position, slot: ProjectSlot, pc?: Pace): number {
  const mine = ProjectSlotSelector.getPlayerContribution(slot, p.me);
  if (isComplete(slot)) return mine + (slot.owner === p.me ? ownerBonus(p, slot) : 0) + contractBonus(p, slot, pc);
  const horizon = p.roundsLeft >= 3 ? 1 : p.roundsLeft === 2 ? 0.75 : 0.4;
  const base = p.profile.weights.baseCompletionChance;
  const chance = p.profile.planner ? finishChance(p, slot, pc) : Math.min(0.95, (base + (1 - base) * filledShare(slot)) * horizon);
  const stake = mine + (slot.owner === p.me ? ownerBonus(p, slot) : 0) + contractBonus(p, slot, pc);
  return chance * stake + (1 - chance) * 0.5 * mine;
}

/** Expected contract points for this completion; existing contracts are already sunk value. */
export function contractBonus(p: Position, slot: ProjectSlot, pc = pace(p)): number {
  if (!hasNode(p.view, 'government-2') || slot.card!.difficulty < 3) return 0;
  if (treeRules(p.view) === 'v2-maintenance') {
    if (slot.owner !== p.me) return 0;
    if (isComplete(slot)) return p.roundsLeft;
    const open = Object.entries(slot.card!.requirements).map(([job, need]) => [job, Math.max(0, need - ProjectSlotSelector.getJobContribution(slot, job))] as const);
    const missing = open.filter(([job, n]) => n > 0 && !ProjectSlotSelector.hasWorker(slot, job, p.me));
    const recruited = missing.reduce((sum, [, n]) => sum + Math.min(pc.recruit, n), 0);
    const unfilled = open.reduce((sum, [, n]) => sum + n, 0);
    const need = missing.length + Math.ceil(Math.max(0, unfilled - recruited) / pc.owned);
    return Math.max(0, p.roundsLeft - need / pc.apPerRound);
  }
  if (treeRules(p.view) === 'v2-collab') return slot.owner !== p.me && slot.contributions.some(c => c.worker === p.me) ? 2 : 0;
  return 0;
}

/** The rules that set how fast a project fills: contribution caps, recruit value, start cost and AP per round. */
export interface Pace {
  owned: number;
  joined: number;
  recruit: number;
  createCost: number;
  apPerRound: number;
  /** First contribution for an engineer (v1) or a main job (v2 Source 3). */
  boostedStart: number;
}

/** The pace under the current rules, or as it would be with `node` grown. */
export function pace(p: Position, node?: NodeId): Pace {
  const { action, player } = p.view.rules;
  return {
    owned: action.contributeOwnedProjects.maxContributionValue + (node === 'data-4' ? 1 : 0),
    joined: action.contributeJoinedProjects.maxContributionValue + (node === 'source-2' ? 1 : 0),
    recruit: node === 'data-2' ? 2 : action.recruit.initialContributionValue,
    createCost: node === 'source-5' ? 1 : RuleSelector.getActionTokenCost(p.view.rules, 'createProject'),
    apPerRound: player.maxActionTokens + (node === 'data-3' ? 1 : 0),
    boostedStart: node === 'source-3' || hasNode(p.view, 'source-3') ? 3 : action.createProject.initialContributionValue,
  };
}

/** AP of slack over which finishing goes from unlikely to likely; the planner's pace estimate is rough. */
const PACE_SPREAD = 1.5;
/** Chance a plan with `budget` AP covers `need` AP: about half when they match, near 0.95 with a few AP to spare. */
const paceChance = (budget: number, need: number) => 0.95 / (1 + Math.exp(-(budget - need) / PACE_SPREAD));

/**
 * Planner: chance to finish a project, from the AP `me` still needs against
 * the AP it has left. Other contributors first fill the jobs they hold cubes
 * on with their planned share of AP; `me` then needs one recruit per open job
 * it has no cube on and contributions at its cap for the rest.
 */
export function finishChance(p: Position, slot: ProjectSlot, pc = pace(p)): number {
  const { focus, helperShare } = p.profile.planner!;
  const open = Object.entries(slot.card!.requirements).map(([job, need]) => [job, Math.max(0, need - ProjectSlotSelector.getJobContribution(slot, job))] as const);
  let left = open.reduce((sum, [, n]) => sum + n, 0);
  if (left === 0) return 1;
  for (const worker of Array.from(new Set(slot.contributions.map(c => c.worker).filter(worker => worker !== p.me)))) {
    const room = open.filter(([job]) => ProjectSlotSelector.hasWorker(slot, job, worker)).reduce((sum, [, n]) => sum + n, 0);
    left -= Math.min(room, (slot.owner === worker ? pc.owned : pc.joined) * helperShare * pc.apPerRound * p.roundsLeft);
  }
  if (left <= 0) return 0.95;
  const missing = open.filter(([job, n]) => n > 0 && !ProjectSlotSelector.hasWorker(slot, job, p.me));
  const recruited = missing.reduce((sum, [, n]) => sum + Math.min(pc.recruit, n), 0);
  const need = missing.length + Math.ceil(Math.max(0, left - recruited) / (slot.owner === p.me ? pc.owned : pc.joined));
  const budget = focus * (p.view.players[p.me].token.actions + (p.roundsLeft - 1) * pc.apPerRound);
  return paceChance(budget, need);
}

/**
 * Planner: expected net points of starting `card` alone and working it for
 * `rounds` rounds: the AP the project needs, the chance the planned AP covers
 * it, the points if it completes (contributions, owner and finisher rewards)
 * or half the contributions made if not, plus the start reward, minus
 * `apValue` for every AP it ties up.
 */
export function cardValue(p: Position, card: CardSpec, rounds: number, pc = pace(p)): number {
  if (rounds <= 0) return 0;
  const { focus, apValue } = p.profile.planner!;
  const rules = p.view.rules;
  const jobs = Object.entries(card.requirements);
  const total = jobs.reduce((sum, [, n]) => sum + n, 0);
  const v2 = treeRules(p.view) !== 'v1';
  const startJob = v2 && pc.boostedStart > rules.action.createProject.initialContributionValue ? mainJobs(card)[0] : card.requirements['工程師'] ? '工程師' : jobs[0][0];
  const start = Math.min((v2 || startJob === '工程師') ? pc.boostedStart : rules.action.createProject.initialContributionValue, card.requirements[startJob]);
  const recruited = jobs.filter(([job]) => job !== startJob).reduce((sum, [, n]) => sum + Math.min(pc.recruit, n), 0);
  const need = pc.createCost + jobs.length - 1 + Math.ceil(Math.max(0, total - start - recruited) / pc.owned);
  const budget = focus * rounds * pc.apPerRound;
  const chance = paceChance(budget, need);
  const spent = Math.min(need, budget);
  const experiments = p.view.standard?.experiments;
  const rewards = completionReward(experiments, card.difficulty, rules.settlement.projectOwnerVictoryPoints)
    + completionReward(experiments, card.difficulty, rules.settlement.lastContributorVictoryPoints);
  const contract = treeRules(p.view) === 'v2-maintenance' && hasNode(p.view, 'government-2') && card.difficulty >= 3 ? Math.max(0, rounds - need / pc.apPerRound) : 0;
  const expected = chance * (total + rewards + contract) + (1 - chance) * 0.5 * total * (spent / need);
  return (expected + rules.action.createProject.victoryPoints - apValue * spent) * p.profile.weights.points;
}

/** Cards of a pile `me` has not seen on the board, in its hand or completed; the whole pile if it has seen them all. */
function unseenCards(p: Position, advanced: boolean): CardSpec[] {
  const seen = new Set([
    ...p.view.table.projectBoard.flatMap(slot => (slot.card ? [slot.card.name] : [])),
    ...(p.view.players[p.me].hand?.projects ?? []).map(card => card.name),
    ...(p.view.standard?.log ?? []).filter(entry => entry.kind === 'complete').map(entry => entry.target),
  ]);
  const pile = PROJECT_CARDS.filter(card => (card.difficulty > 2) === advanced);
  const unseen = pile.filter(card => !seen.has(card.name));
  return unseen.length ? unseen : pile;
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

/**
 * Planner: what growing `node` adds to `me`'s live projects and hand cards
 * through faster pace, e.g. a 3★ that becomes finishable in the rounds left.
 */
function paceGain(p: Position, node: NodeId): number {
  const after = pace(p, node);
  const next = treeRules(p.view) !== 'v1' ? { ...p, view: { ...p.view, standard: { ...p.view.standard!, grown: [...p.view.standard!.grown, node] } } } : p;
  const live = p.view.table.projectBoard.filter(slot => slot.card && !isComplete(slot) && slot.contributions.some(c => c.worker === p.me));
  const hand = p.view.players[p.me].hand?.projects ?? [];
  return live.reduce((sum, slot) => sum + projectValue(next, slot, after) - projectValue(p, slot), 0)
    + hand.reduce((sum, card) => sum + cardValue(next, card, p.roundsLeft, after) - cardValue(p, card, p.roundsLeft), 0);
}

function advancedAccessValue(p: Position, node: NodeId): number {
  if (node !== 'government-1' || treeRules(p.view) === 'v1' || !p.profile.planner || p.roundsLeft <= 1) return 0;
  const next = { ...p.view, standard: { ...p.view.standard!, grown: [...p.view.standard!.grown, node] } };
  const score = p.view.table.scoreBoard[p.me] + REWARDS[0];
  if (score <= advancedScoreGate(next) || score > advancedScoreGate(p.view)) return 0;
  const value = (advanced: boolean) => {
    const cards = unseenCards(p, advanced);
    return cards.reduce((sum, card) => sum + cardValue(p, card, p.roundsLeft - 1), 0) / cards.length;
  };
  return Math.max(0, value(true) - value(false));
}

/**
 * Value of a tree node: its reward, the consequence of its ability for the
 * rest of the game, and what it unlocks. A planner prices the ability's AP at
 * `apValue` and adds its pace gain on the bot's own projects.
 */
export function nodeValue(p: Position, node: NodeId): number {
  const w = p.profile.weights;
  const tier = Number(node.split('-')[1]);
  const beneficiaries = 1 + w.village * (p.ctx.numPlayers - 1);
  const perAp = p.profile.planner?.apValue ?? w.pointsPerAP;
  const variant = treeRules(p.view);
  const impact = variant === 'v1' ? p.profile.nodeImpact : V2_NODE_IMPACT[variant];
  const flatImpact = variant !== 'v1' && p.profile.planner && (node === 'government-1' || node === 'government-2') ? 0 : impact[node];
  const consequence = flatImpact * Math.max(0, p.roundsLeft - 0.5) * beneficiaries * perAp
    + (p.profile.planner ? paceGain(p, node) : 0) + advancedAccessValue(p, node);
  const grown = p.view.standard?.grown ?? [];
  const progress = treeProgress(p.view);
  const unlock = tier === 5 ? 0 : nodesConnectedBy(p.view, node)
    .filter(next => !grown.includes(next) && !isConnected(p.view, next))
    .reduce((sum, next) => sum + REWARDS[tier] * (progress.value >= progress.thresholds[tier] ? 1 : 0.5), 0) * w.unlock;
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
  // A drawn or kept card can first be started next round.
  if (choice.kind === 'draw') {
    if (!p.profile.planner || p.roundsLeft <= 1) return target.pile === 'advanced' ? w.advancedDraw : 0;
    const pile = unseenCards(p, target.pile === 'advanced');
    return pile.reduce((sum, card) => sum + cardValue(p, card, p.roundsLeft - 1), 0) / pile.length;
  }
  if (choice.kind === 'discard') {
    const card = p.view.players[p.me].hand?.projects.find(c => c.id === target.cardId);
    if (!card) return 0;
    if (p.profile.planner) return -cardValue(p, card, p.roundsLeft - 1);
    const market = new Set(p.view.table.jobSlots.map(j => j.name));
    const playable = Object.keys(card.requirements).some(job => market.has(job));
    return (card.difficulty - 2) * 0.5 + (playable ? 0 : 0.5);
  }
  const slot = slotByProject(p, target.projectId);
  if (!slot || !target.jobName) return 0;
  if (choice.kind === 'source4' && treeRules(p.view) !== 'v1'
    && (target.worker !== p.me || !ProjectSlotSelector.hasWorker(slot, target.jobName, p.me))) return -Infinity;
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
      const start = hasNode(view, 'source-3') && (treeRules(view) === 'v1' ? job.name === '工程師' : mainJobs(card).includes(jobName)) ? 3 : view.rules.action.createProject.initialContributionValue;
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
