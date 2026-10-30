import { completionReward } from './config';
import { publicProjects, recordHistory, scoreWithHistory } from './history';
import type { FnContext } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import type { GameState, ClientGameState } from '../store/store';
import type { Choice, ChoiceKind, NodeId } from './state';
import { advancedScoreGate, feature, growthReason, hasNode, REWARDS } from './tree';
import { ProjectBoardMutator, ProjectBoardSelector } from '../store/slice/projectBoard';
import ProjectSlotSlice, { ProjectSlotSelector, ProjectSlotMutator } from '../store/slice/projectSlot/projectSlot';
import { PlayersMutator } from '../store/slice/players';
import { ActionSlotsMutator } from '../store/slice/actionSlots';
import type { GameMove } from '../core/type';
import { RuleMutator } from '../store/slice/rule';
import { trackAdvancedDraw, trackCompletion, trackNoTarget, trackQueued, trackResolved, trackScores } from './telemetry';

export function enqueue(G: GameState, kind: ChoiceKind, playerId: string, projectId?: string, budget = 1) {
  const s = G.standard!;
  s.choices.push({ id: s.nextChoiceId++, kind, playerId, projectId, budget });
  trackQueued(G, kind, budget);
}
export function log(G: GameState, kind: string, playerId?: string, target?: string) {
  recordHistory(G, { kind, playerId, target });
}
export function fillMarket(G: GameState) {
  const deck = G.decks.jobs;
  const needed = Math.max(0, G.rules.table.maxJobSlots - G.table.jobSlots.length);
  if (deck.drawPile.length < needed) {
    deck.drawPile.push(...deck.discardPile); deck.discardPile = [];
  }
  G.table.jobSlots.push(...deck.drawPile.splice(0, needed));
}
export function syncTreeRules(G: GameState) {
  if (!G.standard) return;
  const r = G.rules;
  const fourFreedoms = G.table.eventSlot?.function_name === 'add_two_worker_slots';
  const tomato = G.table.eventSlot?.function_name === 'increase_one_owned_project_contribution_value';
  r.table.maxJobSlots = (hasNode(G, 'source-1') ? 8 : 6) + (fourFreedoms ? 2 : 0);
  r.table.maxProjectSlots = hasNode(G, 'government-3') ? 8 : 6;
  r.player.maxProjectCards = hasNode(G, 'data-1') ? 3 : 2;
  r.player.maxActionTokens = hasNode(G, 'data-3') ? 4 : 3;
  r.action.createProject.actionCost = hasNode(G, 'source-5') ? 1 : 2;
  r.action.recruit.initialContributionValue = hasNode(G, 'data-2') ? 2 : 1;
  r.action.contributeOwnedProjects.maxContributionValue = (hasNode(G, 'data-4') ? 4 : 3) + (tomato ? 1 : 0);
  r.action.contributeJoinedProjects.maxContributionValue = hasNode(G, 'source-2') ? 5 : 4;
  while (G.table.projectBoard.length < r.table.maxProjectSlots) {
    G.table.projectBoard.push(ProjectSlotSlice.initialState(`project-slot-${G.table.projectBoard.length}`));
  }
  G.standard.nextEvent = hasNode(G, 'government-2') && feature(G, 'government2') === 'preview' ? G.decks.events.drawPile[0] : undefined;
}
export const growTree: GameMove<(node: NodeId, overtime?: boolean) => void> = ({ G, ctx, playerID }, node, overtime = false) => {
  if (playerID !== ctx.currentPlayer || growthReason(G, node, playerID, overtime)) return INVALID_MOVE;
  const s = G.standard!;
  G.players[playerID].token.actions--;
  if (overtime) G.players[playerID].token.overtime--;
  s.growthUsed = true;
  s.grown.push(node);
  scoreWithHistory(G, playerID, REWARDS[Number(node.split('-')[1]) - 1], `星源樹成長 ${node}`);
  if (node === 'data-3') Object.values(G.players).forEach(p => p.token.actions++);
  syncTreeRules(G);
  if (node === 'source-1') fillMarket(G);
  log(G, 'grow', playerID, node);
};

export interface ChoiceTarget { projectId: string; worker?: string; jobName?: string; jobCardId?: string; cardId?: string; pile?: 'entry' | 'advanced' }
export interface ChoiceOption { label: string; target: ChoiceTarget }
export function choiceOptions(G: GameState | ClientGameState, c: Choice): ChoiceOption[] {
  const unfinished = ProjectBoardSelector.getUnfinished(G.table.projectBoard);
  if (c.kind === 'discard') return (G.players[c.playerId]?.hand?.projects ?? []).map(card => ({ label: card.name, target: { projectId: '', cardId: card.id } }));
  if (c.kind === 'draw') {
    return [{ label: '入門專案', target: { projectId: '', pile: 'entry' as const } },
      ...(G.table.scoreBoard[c.playerId] > advancedScoreGate(G) ? [{ label: '進階專案', target: { projectId: '', pile: 'advanced' as const } }] : [])];
  }
  const options: ChoiceOption[] = [];
  for (const slot of unfinished) {
    if (c.kind === 'digitalMinister' && slot.card!.id !== c.projectId) continue;
    if (c.kind === 'government4' || c.kind === 'extraRecruit') {
      if ((c.kind === 'government4' && slot.card!.id === c.projectId) || G.players[c.playerId].token.workers < 1) continue;
      for (const card of G.table.jobSlots) {
        const jobs = G.rules.event?.ignoreFirstWorkerRequirement?.[c.playerId] ? Object.keys(slot.card!.requirements)
          : Object.keys(slot.card!.requirements).includes(card.name) ? [card.name] : [];
        for (const jobName of jobs) {
          if (ProjectSlotSelector.hasWorker(slot, jobName, c.playerId) || ProjectSlotSelector.getJobContribution(slot, jobName) >= slot.card!.requirements[jobName]) continue;
          options.push({ label: `${slot.card!.name} / ${card.name} → ${jobName}`, target: { projectId: slot.card!.id, jobName, jobCardId: card.id } });
        }
      }
      continue;
    }
    if (c.kind === 'government5' && G.standard?.experiments?.government5 === 'any') {
      if (slot.card!.id === c.projectId) continue;
      for (const jobName of Object.keys(slot.card!.requirements)) {
        const cube = slot.contributions.find(cube => cube.worker === c.playerId && cube.jobName === jobName);
        if (!cube && G.players[c.playerId].token.workers < 1) continue;
        if (ProjectSlotSelector.getJobContribution(slot, jobName) >= slot.card!.requirements[jobName]) continue;
        options.push({ label: `${slot.card!.name} / ${jobName} ${cube ? `${cube.value} → ${cube.value + 1}` : '新增自己的方塊 · 庫存 −1'}`, target: { projectId: slot.card!.id, worker: c.playerId, jobName } });
      }
      continue;
    }
    for (const cube of slot.contributions) {
      if (c.kind !== 'digitalMinister' && cube.worker !== c.playerId) continue;
      if (c.kind === 'source4' && feature(G, 'sources') === 'engineer' && cube.jobName !== '工程師') continue;
      if (ProjectSlotSelector.getJobContribution(slot, cube.jobName) >= slot.card!.requirements[cube.jobName]) continue;
      options.push({ label: `${slot.card!.name} / 玩家 ${Number(cube.worker) + 1} / ${cube.jobName} ${cube.value} → ${cube.value + 1}`, target: { projectId: slot.card!.id, worker: cube.worker, jobName: cube.jobName } });
    }
  }
  return options;
}
function sameTarget(a: ChoiceTarget, b: ChoiceTarget) {
  return a.projectId === b.projectId && a.worker === b.worker && a.jobName === b.jobName && a.jobCardId === b.jobCardId && a.cardId === b.cardId && a.pile === b.pile;
}
export const resolveStandardChoice: GameMove<(id: number, target: ChoiceTarget | null) => void> = ({ G, playerID }, id, target) => {
  const s = G.standard;
  const c = s?.choices[0];
  if (!s || !c || c.id !== id || c.playerId !== playerID) return INVALID_MOVE;
  if (target !== null && (!target || !choiceOptions(G, c).some(o => sameTarget(o.target, target)))) return INVALID_MOVE;
  // Only public descriptions enter shared history. A discarded hand card's
  // identity is private, even after it returns to the bottom of its deck.
  const publicTarget = target && c.kind !== 'discard'
    ? choiceOptions(G, c).find(option => sameTarget(option.target, target))?.label : undefined;
  if (c.kind === 'draw' && target === null) return INVALID_MOVE;
  if (target) {
    if (c.kind === 'discard') {
      const hand = G.players[playerID].hand.projects;
      const index = hand.findIndex(card => card.id === target.cardId);
      const [card] = hand.splice(index, 1);
      (card.difficulty <= 2 ? G.decks.projects : G.decks.advanced!).drawPile.push(card);
    } else if (c.kind === 'draw') {
      const advancedEligible = G.table.scoreBoard[playerID] > advancedScoreGate(G);
      const preferred = target.pile === 'advanced' ? G.decks.advanced! : G.decks.projects;
      const fallback = target.pile === 'advanced' ? G.decks.projects : advancedEligible ? G.decks.advanced! : undefined;
      const advancedBefore = G.decks.advanced!.drawPile.length;
      const card = preferred.drawPile.shift() ?? fallback?.drawPile.shift();
      if (card) G.players[playerID].hand.projects.push(card);
      if (G.decks.advanced!.drawPile.length < advancedBefore) trackAdvancedDraw(G, playerID);
    } else {
      const slot = G.table.projectBoard.find(p => p.card?.id === target.projectId)!;
      if (c.kind === 'government4' || c.kind === 'extraRecruit') {
        const index = G.table.jobSlots.findIndex(card => card.id === target.jobCardId);
        G.decks.jobs.discardPile.push(...G.table.jobSlots.splice(index, 1));
        G.players[playerID].token.workers--;
        const amount = Math.min(G.rules.action.recruit.initialContributionValue, slot.card!.requirements[target.jobName!] - ProjectSlotSelector.getJobContribution(slot, target.jobName!));
        ProjectSlotMutator.assignWorker(slot, target.jobName!, playerID, amount);
        if (G.rules.event?.ignoreFirstWorkerRequirement?.[playerID]) RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, playerID);
        fillMarket(G);
      } else {
        if (c.kind === 'government5' && !ProjectSlotSelector.hasWorker(slot, target.jobName!, playerID)) {
          G.players[playerID].token.workers--;
        }
        ProjectSlotMutator.pushWorker(slot, target.jobName!, target.worker!, 1);
      }
    }
    recordHistory(G, { kind: c.kind, playerId: playerID, target: publicTarget,
      ...(target.projectId ? { projects: publicProjects(G).filter(project => project.id === target.projectId) } : {}),
    });
  } else log(G, `${c.kind}:skip`, playerID);
  trackResolved(G, c, !target);
  // A fresh ID for each point prevents duplicate submissions spending twice.
  s.choices.shift();
  if (c.kind === 'government5' && target && c.budget > 1) {
    s.choices.unshift({ ...c, id: s.nextChoiceId++, budget: c.budget - 1 });
    // Each point is its own choice; its budget was counted when first queued.
    trackQueued(G, c.kind, 0);
  }
}
function settleStandard(G: GameState) {
  const s = G.standard!;
  const completed = ProjectBoardSelector.getRequirementFulfilled(G.table.projectBoard);
  for (const slot of completed) {
    if (s.completedProjectIds.includes(slot.card!.id)) continue;
    const ownerContribution = ProjectSlotSelector.getPlayerContribution(slot, slot.owner);
    const snapshot = publicProjects(G).find(project => project.id === slot.card!.id)!;
    const engineer = slot.contributions.some(c => c.jobName === '工程師');
    for (const cube of slot.contributions) {
      scoreWithHistory(G, cube.worker, cube.value, '結案貢獻', snapshot);
      PlayersMutator.addWorkerTokens(G.players, cube.worker, 1);
    }
    const ownerReward = completionReward(s.experiments, slot.card!.difficulty, G.rules.settlement.projectOwnerVictoryPoints);
    const finisherReward = completionReward(s.experiments, slot.card!.difficulty, G.rules.settlement.lastContributorVictoryPoints);
    scoreWithHistory(G, slot.owner, ownerReward, '發起獎勵', snapshot);
    scoreWithHistory(G, slot.owner, G.rules.event?.extraOwnerVictoryPoints ?? 0, '年度結算發起獎勵', snapshot);
    scoreWithHistory(G, slot.lastContributor, finisherReward, '結案獎勵', snapshot);
    // Government 2 contracts cover 3★ and 4★ projects completed while it is grown.
    const contract = hasNode(G, 'government-2') && slot.card!.difficulty >= 3 ? feature(G, 'government2') : 'preview';
    if (contract === 'collab') {
      for (const helper of Array.from(new Set(slot.contributions.map(c => c.worker))).filter(w => w !== slot.owner)) scoreWithHistory(G, helper, 2, '協作合約', snapshot);
    }
    if (contract === 'maintenance') s.maintenance = { ...s.maintenance, [slot.owner]: (s.maintenance?.[slot.owner] ?? 0) + 1 };
    PlayersMutator.addWorkerTokens(G.players, slot.owner, slot.ownerToken);
    s.completedProjectIds.push(slot.card!.id);
    s.completedComplexity = (s.completedComplexity ?? 0) + slot.card!.difficulty;
    log(G, 'complete', slot.lastContributor, slot.card!.name);
    trackCompletion(G, slot);
    if (hasNode(G, 'source-4') && (engineer || feature(G, 'sources') === 'main-job')) enqueue(G, 'source4', slot.lastContributor, slot.card!.id);
    if (hasNode(G, 'government-5') && ownerContribution >= 2) enqueue(G, 'government5', slot.owner, slot.card!.id, Math.floor(ownerContribution / 2));
  }
  ProjectBoardMutator.remove(G.table.projectBoard, completed);
}
/** Round-end income from v2 維運合約, paid from the round the project completed in. */
export function endStandardRound(G: GameState) {
  for (const [playerId, contracts] of Object.entries(G.standard?.maintenance ?? {})) scoreWithHistory(G, playerId, contracts, '維運合約');
}
export function beginStandardEvent(G: GameState) {
  if (!G.standard) return;
  const s = G.standard;
  s.round++;
  s.extraRecruitUsed = {};
  if (G.table.eventSlot?.function_name === 'retreat_contributions') {
    for (const slot of G.table.projectBoard) if (slot.card) {
      for (const cube of slot.contributions) cube.value = Math.max(1, cube.value - 1);
    }
  }
  log(G, 'event', undefined, G.table.eventSlot?.name);
  if (G.table.eventSlot?.function_name === 'digital_minister') {
    s.phase = 'event';
    for (const slot of G.table.projectBoard) if (slot.card) enqueue(G, 'digitalMinister', slot.owner, slot.card.id);
  }
  syncTreeRules(G);
  fillMarket(G);
  if (G.table.eventSlot?.function_name === 'add_two_worker_slots') {
    G.table.fourFreedomsPendingDiscards = G.table.jobSlots.slice(-2).map(card => card.id);
  }
  recordHistory(G, { kind: 'eventEffect', target: G.table.eventSlot?.description,
    projects: publicProjects(G), market: G.table.jobSlots.map(card => card.name),
    actionPoints: Object.fromEntries(Object.entries(G.players).map(([id, player]) => [id, player.token.actions])),
  });
}
export function advanceStandard(context: FnContext<GameState>) {
  const { G, ctx, events } = context;
  const s = G.standard;
  if (!s) return;
  // Run after every move and at turn start; only one player owns a pending choice.
  while (true) {
    trackScores(G);
    while (s.choices.length && choiceOptions(G, s.choices[0]).length === 0) trackNoTarget(G, s.choices.shift()!);
    if (s.choices.length) {
      const owner = s.choices[0].playerId;
      if (ctx.activePlayers?.[owner] !== 'standardChoice' || Object.keys(ctx.activePlayers).length !== 1) {
        events.setActivePlayers({ value: { [owner]: 'standardChoice' } });
      }
      return;
    }
    if (s.phase === 'action') {
      if (G.players[ctx.currentPlayer].token.actions <= 0) {
        if (ctx.playOrderPos === ctx.numPlayers - 1 && G.table.fourFreedomsPendingDiscards.length) {
          G.table.actionPhaseDone = true;
        } else { s.phase = 'settlement'; continue; }
      }
      if (ctx.activePlayers?.[ctx.currentPlayer] !== 'action') events.setActivePlayers({ currentPlayer: 'action' });
      return;
    }
    if (s.phase === 'event' || s.phase === 'settlement') {
      settleStandard(G);
      if (s.choices.length) continue;
      if (s.phase === 'event') { s.phase = 'action'; continue; }
      s.phase = 'restore';
      if (hasNode(G, 'government-1') && feature(G, 'government1') === 'redraw') enqueue(G, 'discard', ctx.currentPlayer);
      continue;
    }
    if (s.phase === 'restore') {
      const player = G.players[ctx.currentPlayer];
      const advancedEligible = G.table.scoreBoard[ctx.currentPlayer] > advancedScoreGate(G);
      const canDraw = G.decks.projects.drawPile.length || (advancedEligible && G.decks.advanced!.drawPile.length);
      if (player.hand.projects.length < G.rules.player.maxProjectCards && canDraw) {
        if (advancedEligible) { enqueue(G, 'draw', ctx.currentPlayer); continue; }
        player.hand.projects.push(G.decks.projects.drawPile.shift()!);
        continue;
      }
      s.phase = 'ready';
    }
    return;
  }
}
export function resetStandardTurn(G: GameState, playerId: string) {
  const s = G.standard!;
  PlayersMutator.resetActionTokens(G.players, playerId, G.rules.player.maxActionTokens);
  PlayersMutator.resetOvertimeTokens(G.players, playerId, 1);
  ActionSlotsMutator.reset(G.table.actionSlots);
  s.growthUsed = false;
  s.phase = 'action';
}
