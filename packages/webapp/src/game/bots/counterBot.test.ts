import type { State } from 'boardgame.io';
import { playerView } from '@/game/core/playerView';
import type { StandardExperiments } from '@/game/standard/config';
import type { GameState } from '@/game/store/store';
import { createCounterBot, exposedToOthers, exposurePenalty } from './counterBot';
import { position } from './evaluate';
import { createProfileBot } from './profileBot';
import { BALANCED, COUNTER, PROFILES } from './profiles';
import { initialState, runGame } from './runner';
import { BOT_STRATEGIES, isBotStrategy } from './strategies';
import type { Bot } from './types';

const balanced = createProfileBot(BALANCED);
const counter = createCounterBot();

function seated(numPlayers: number, seat: string): Record<string, Bot> {
  return Object.fromEntries(Array.from({ length: numPlayers }, (_, i) => [String(i), String(i) === seat ? counter : balanced]));
}

function actionState(): State<GameState> {
  const state = structuredClone(initialState(2, 'counter-test'));
  state.G.standard!.phase = 'action';
  state.G.standard!.choices = [];
  state.ctx = { ...state.ctx, activePlayers: { [state.ctx.currentPlayer]: 'action' } };
  return state;
}

function addProject(G: GameState, owner: string, requirement: number, contributions: { worker: string; value: number }[]) {
  const slot = G.table.projectBoard.find(s => !s.card)!;
  Object.assign(slot, {
    card: { id: 'p', name: 'p', type: 'ignored', difficulty: 1, description: '', requirements: { 工程師: requirement } },
    owner, ownerToken: 1, lastContributor: owner, contributions: contributions.map(c => ({ jobName: '工程師', ...c })),
  });
  return slot;
}

describe('counter bot', () => {
  const scenarios: StandardExperiments[] = [
    { government5: 'existing', completionRewards: 'fixed' },
    { government5: 'any', completionRewards: 'fixed' },
    { government5: 'existing', completionRewards: 'difficulty' },
    { government5: 'any', completionRewards: 'difficulty' },
  ];

  test.each([2, 3, 4])('plays only legal moves to game over at %i players in every scenario and seat', numPlayers => {
    // The runner fails on the first move the game rejects.
    scenarios.forEach((experiments, index) => {
      const seat = String(index % 2);
      const run = runGame({ numPlayers, seed: `counter-legal-${index}`, bots: seated(numPlayers, seat), experiments });
      expect(run.state.ctx.gameover).toBeDefined();
      expect(run.moves.some(move => move.playerID === seat)).toBe(true);
    });
  });

  test('replays the same game from the same seed', () => {
    const play = () => runGame({ numPlayers: 3, seed: 'counter-replay', bots: seated(3, '0') });
    const [first, second] = [play(), play()];
    expect(second.moves).toEqual(first.moves);
    expect(second.state.G.table.scoreBoard).toEqual(first.state.G.table.scoreBoard);
  });

  test('penalises leaving a project that another player can finish first', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    const other = me === '0' ? '1' : '0';
    const slot = addProject(state.G, me, 8, [{ worker: me, value: 1 }, { worker: other, value: 1 }]);
    state.G.players[me].token.overtime = 0;
    const view = playerView({ G: state.G, ctx: state.ctx, playerID: me });
    expect(exposedToOthers(view, me, view.table.projectBoard.find(s => s.id === slot.id)!)).toBe(false);
    const p = position(view, state.ctx, me, COUNTER);
    const leaveThree = { move: 'contributeOwnedProjects', args: [[{ projectSlotId: slot.id, jobName: '工程師', value: 3 }], undefined] };
    const leaveFive = { move: 'contributeOwnedProjects', args: [[{ projectSlotId: slot.id, jobName: '工程師', value: 1 }], undefined] };
    expect(exposurePenalty(p, leaveThree)).toBeCloseTo(state.G.rules.settlement.lastContributorVictoryPoints);
    expect(exposurePenalty(p, leaveFive)).toBe(0);
  });

  test('does not penalise a contribution it can follow up with overtime this turn', () => {
    const state = actionState();
    const me = state.ctx.currentPlayer;
    const other = me === '0' ? '1' : '0';
    const slot = addProject(state.G, me, 8, [{ worker: me, value: 1 }, { worker: other, value: 1 }]);
    state.G.players[me].token.overtime = 1;
    const view = playerView({ G: state.G, ctx: state.ctx, playerID: me });
    const p = position(view, state.ctx, me, COUNTER);
    const contribute = { move: 'contributeOwnedProjects', args: [[{ projectSlotId: slot.id, jobName: '工程師', value: 3 }], undefined] };
    expect(exposurePenalty(p, contribute)).toBe(0);
  });
});

describe('counter strategy registry entry', () => {
  test('is a seatable strategy whose bot uses the counter profile', () => {
    const strategy = BOT_STRATEGIES.counter;
    expect(isBotStrategy('counter')).toBe(true);
    expect(strategy.id).toBe('counter');
    expect(strategy.profile).toBe(PROFILES.counter);
    expect(strategy.label).toMatch(/Counter/);
    expect(strategy.description.length).toBeGreaterThan(0);
    expect(strategy.createBot(strategy.profile).name).toBe('counter');
  });

  test('seat names do not clash with another strategy', () => {
    const names = Object.values(BOT_STRATEGIES).flatMap(s => s.names);
    expect(new Set(names).size).toBe(names.length);
  });

  test('keeps Balanced unchanged', () => {
    expect(BOT_STRATEGIES.balanced.profile).toBe(BALANCED);
    expect(BALANCED.weights).toMatchObject({ village: 0.3, tree: 1, unlock: 0.5, initiation: 0 });
  });
});
