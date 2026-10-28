import type { State } from 'boardgame.io';
import { playerView } from '@/game/core/playerView';
import type { GameState } from '@/game/store/store';
import { createProfileBot } from './profileBot';
import { nodeValue, position, scoreAction } from './evaluate';
import { NOVICE, withWeights } from './profiles';
import { initialState } from './runner';
import type { BotAction } from './types';

function actionState(): State<GameState> {
  const state = structuredClone(initialState(2, 'profile-test'));
  // Start the action stage for the current player with an empty board.
  state.G.standard!.phase = 'action';
  state.G.standard!.choices = [];
  state.ctx = { ...state.ctx, activePlayers: { [state.ctx.currentPlayer]: 'action' } };
  return state;
}

function addProject(G: GameState, id: string, owner: string, requirement: number, value: number) {
  const slot = G.table.projectBoard.find(s => !s.card)!;
  Object.assign(slot, {
    card: { id, name: id, type: 'ignored', difficulty: 1, description: '', requirements: { 工程師: requirement } },
    owner, ownerToken: 1, lastContributor: owner, contributions: [{ jobName: '工程師', worker: owner, value }],
  });
  return slot;
}

function decide(state: State<GameState>, playerID: string): BotAction {
  const view = playerView({ G: state.G, ctx: state.ctx, playerID });
  return createProfileBot(NOVICE).decide({ view, ctx: state.ctx, playerID, random: () => 0 });
}

describe('novice profile', () => {
  test('finishes a project it can complete this turn over a partial contribution', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    const near = addProject(state.G, 'near', me, 4, 2);
    const far = addProject(state.G, 'far', me, 8, 1);
    const p = position(playerView({ G: state.G, ctx: state.ctx, playerID: me }), state.ctx, me, NOVICE);
    const finish = { move: 'contributeOwnedProjects', args: [[{ projectSlotId: near.id, jobName: '工程師', value: 2 }], undefined] };
    const partial = { move: 'contributeOwnedProjects', args: [[{ projectSlotId: far.id, jobName: '工程師', value: 2 }], undefined] };
    expect(scoreAction(p, finish)).toBeGreaterThan(scoreAction(p, partial));
  });

  test('never prefers overtime over the same action without it', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    const slot = addProject(state.G, 'own', me, 6, 1);
    const p = position(playerView({ G: state.G, ctx: state.ctx, playerID: me }), state.ctx, me, NOVICE);
    const contribution = [{ projectSlotId: slot.id, jobName: '工程師', value: 1 }];
    expect(scoreAction(p, { move: 'contributeOwnedProjects', args: [contribution, undefined] }))
      .toBeGreaterThan(scoreAction(p, { move: 'contributeOwnedProjects', args: [contribution, { useOvertime: true }] }));
  });

  test('tree node value starts from the reward and grows with its consequence impact', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    const view = playerView({ G: state.G, ctx: state.ctx, playerID: me });
    const noImpact = { ...NOVICE, nodeImpact: { ...NOVICE.nodeImpact, 'data-1': 0 } };
    const noUnlock = withWeights(noImpact, { unlock: 0 });
    expect(nodeValue(position(view, state.ctx, me, noUnlock), 'data-1')).toBeCloseTo(1);
    expect(nodeValue(position(view, state.ctx, me, NOVICE), 'data-3')).toBeGreaterThan(nodeValue(position(view, state.ctx, me, NOVICE), 'data-1'));
  });

  test('leftover AP in the last round raises the cost of spending AP', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    state.G.rules.settlement.leftoverActionTokensVictoryPoints = 1;
    const p = position(playerView({ G: state.G, ctx: state.ctx, playerID: me }), state.ctx, me, NOVICE);
    expect(p.apCost).toBe(1);
  });

  test('plays a legal opening move instead of ending the turn', () => {
    const state = actionState();
    expect(decide(state, state.ctx.currentPlayer).move).not.toBe('endActionTurn');
  });
});

test('bot evaluates the selected completion reward and new Government 5 cube cost', () => {
  const state = actionState();
  const me = state.ctx.currentPlayer;
  const other = me === '0' ? '1' : '0';
  const slot = addProject(state.G, 'experiment', other, 8, 1);
  slot.card!.difficulty = 4;
  state.G.standard!.experiments = { government5: 'any', completionRewards: 'fixed' };
  state.G.standard!.choices = [{ id: 1, kind: 'government5', playerId: me, projectId: 'done', budget: 1 }];
  const action = { move: 'resolveStandardChoice', args: [1, { projectId: 'experiment', worker: me, jobName: '工程師' }] };
  const score = (workerToken: number) => scoreAction(position(playerView({ G: state.G, ctx: state.ctx, playerID: me }), state.ctx, me, withWeights(NOVICE, { workerToken })), action);
  expect(score(0) - score(1)).toBeCloseTo(1);
  slot.contributions[0].value = 7;
  const fixed = score(0);
  state.G.standard!.experiments.completionRewards = 'difficulty';
  expect(score(0) - fixed).toBeCloseTo(2 * NOVICE.weights.points);
});
