import type { State } from 'boardgame.io';
import type { GameState } from '@/game/store/store';
import type { TreeRules } from '@/game/standard/options';
import { normalizeStandardOptions } from '@/game/standard/options';
import { playerView } from '@/game/core/playerView';
import { cardValue, nodeValue, position, scoreAction } from './evaluate';
import { ADVANCE, NORMAL, NOVICE, type Profile } from './profiles';
import { initialState } from './runner';

function state(rule: TreeRules = 'v2-collab') {
  const s = structuredClone(initialState(2, 'v2-values', undefined, normalizeStandardOptions({ treeRules: rule })));
  s.G.standard!.phase = 'action';
  s.G.standard!.choices = [];
  return s;
}
function at(s: State<GameState>, profile: Profile = NOVICE) {
  return position(playerView({ G: s.G, ctx: s.ctx, playerID: '0' }), s.ctx, '0', profile);
}
function project(s: State<GameState>, owner = '1', difficulty = 3) {
  const slot = s.G.table.projectBoard[0];
  Object.assign(slot, { card: { id: 'test', name: 'test', type: 'ignored', difficulty, requirements: { 法務: 2 } },
    owner, ownerToken: 1, lastContributor: owner, contributions: [{ jobName: '法務', worker: owner, value: 1 }] });
  s.G.table.jobSlots[0] = { ...s.G.table.jobSlots[0], name: '法務', id: 'law' };
  return slot;
}

test('v2 unlocks all three next-tier nodes, with no second unlock value once connected', () => {
  const a = state('v1'), b = state();
  const p = { ...NOVICE, weights: { ...NOVICE.weights, pointsPerAP: 0 } };
  expect(nodeValue(at(b, p), 'source-1') - nodeValue(at(a, p), 'source-1')).toBe(1);
  b.G.standard!.grown = ['government-1'];
  expect(nodeValue(at(b, p), 'source-1')).toBe(1);
});

test.each(['v2-collab', 'v2-maintenance'] as const)('%s Source 3 starts with a main job, including ties and wildcard assignments', rule => {
  const s = state(rule);
  const card = { ...s.G.players['0'].hand.projects[0], requirements: { 工程師: 1, 法務: 4, 文案企劃: 4 } };
  s.G.players['0'].hand.projects = [card];
  s.G.table.jobSlots[0] = { ...s.G.table.jobSlots[0], id: 'job', name: '美術設計' };
  const score = (target: string) => scoreAction(at(s), { move: 'createProject', args: [card.id, 'job', target] });
  const before = score('法務');
  s.G.standard!.grown = ['source-3'];
  expect(score('法務')).toBeGreaterThan(before);
  expect(score('文案企劃')).toBe(score('法務'));
  const engineer = score('工程師');
  s.G.standard!.grown = [];
  expect(score('工程師')).toBe(engineer);
});

test('Normal models main-job initiation in hand values, while v1 keeps engineer priority', () => {
  const s = state();
  const card = { name: 'main', difficulty: 3, requirements: { 工程師: 1, 法務: 8 } };
  s.G.standard!.grown = ['source-3'];
  const v2 = cardValue(at(s, NORMAL), card, 3);
  s.G.standard!.options!.treeRules = 'v1';
  expect(v2).toBeGreaterThan(cardValue(at(s, NORMAL), card, 3));
});

test.each([3, 4])('collab values a new helper on a %i-star completion at +2', difficulty => {
  const s = state();
  const slot = project(s, '1', difficulty);
  const action = { move: 'recruit', args: ['law', slot.id] };
  const before = scoreAction(at(s), action);
  s.G.standard!.grown = ['government-2'];
  expect(scoreAction(at(s), action) - before).toBeCloseTo(2);
});

test.each([1, 2])('collab adds nothing on %i-star projects', difficulty => {
  const s = state();
  const slot = project(s, '1', difficulty);
  const action = { move: 'recruit', args: ['law', slot.id] };
  const before = scoreAction(at(s), action);
  s.G.standard!.grown = ['government-2'];
  expect(scoreAction(at(s), action)).toBe(before);
});

test('maintenance values owner income over remaining round ends, not helper income', () => {
  const s = state('v2-maintenance');
  const card = { ...s.G.players['0'].hand.projects[0], difficulty: 3, requirements: { 法務: 1 } };
  s.G.players['0'].hand.projects = [card];
  s.G.table.jobSlots[0] = { ...s.G.table.jobSlots[0], id: 'law', name: '法務' };
  const action = { move: 'createProject', args: [card.id, 'law'] };
  for (const round of [1, 7]) {
    s.G.standard!.round = round;
    s.G.standard!.grown = [];
    const before = scoreAction(at(s), action);
    s.G.standard!.grown = ['government-2'];
    expect(scoreAction(at(s), action) - before).toBeCloseTo(at(s).roundsLeft);
  }
  const slot = project(s);
  const help = { move: 'recruit', args: ['law', slot.id] };
  const withContract = scoreAction(at(s), help);
  s.G.standard!.grown = [];
  expect(scoreAction(at(s), help)).toBe(withContract);
});

test('v2 Source 4 evaluates another player’s non-engineer cube and finisher credit', () => {
  const s = state();
  const slot = project(s, '0');
  s.G.standard!.choices = [{ id: 1, kind: 'source4', playerId: '0', projectId: 'done', budget: 1 }];
  const score = scoreAction(at(s), { move: 'resolveStandardChoice', args: [1, { projectId: slot.card!.id, jobName: '法務', worker: '0' }] });
  expect(score).toBeGreaterThan(0);
  slot.contributions[0].worker = '1';
  const other = scoreAction(at(s), { move: 'resolveStandardChoice', args: [1, { projectId: slot.card!.id, jobName: '法務', worker: '1' }] });
  expect(Number.isFinite(other)).toBe(true);
  expect(other).toBeLessThan(score);
});

test('Normal prices earlier advanced access only when growth crosses the gate; Advance keeps flat draws', () => {
  const s = state();
  const profile = { ...NORMAL, planner: { focus: 1, helperShare: 0, apValue: 0 } };
  s.G.table.scoreBoard['0'] = 9; // growth reward reaches 10, not above it
  const locked = nodeValue(at(s, profile), 'government-1');
  s.G.table.scoreBoard['0'] = 10;
  expect(nodeValue(at(s, profile), 'government-1')).toBeGreaterThan(locked);
  s.G.table.scoreBoard['0'] = 21;
  expect(nodeValue(at(s, profile), 'government-1')).toBe(locked);
  s.G.standard!.choices = [{ id: 2, kind: 'draw', playerId: '0', budget: 1 }];
  expect(scoreAction(at(s, ADVANCE), { move: 'resolveStandardChoice', args: [2, { pile: 'advanced' }] })).toBe(ADVANCE.weights.advancedDraw);
});
