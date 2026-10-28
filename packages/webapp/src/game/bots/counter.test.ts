import type { StandardExperiments } from '@/game/standard/config';
import { createProfileBot } from './profileBot';
import { BALANCED, COUNTER } from './profiles';
import { runGame } from './runner';
import type { Bot } from './types';

const balanced = createProfileBot(BALANCED);
const counter = createProfileBot(COUNTER);

function seated(numPlayers: number, seat: string): Record<string, Bot> {
  return Object.fromEntries(Array.from({ length: numPlayers }, (_, i) => [String(i), String(i) === seat ? counter : balanced]));
}

describe('counter profile', () => {
  const scenarios: StandardExperiments[] = [
    { government5: 'existing', completionRewards: 'fixed' },
    { government5: 'any', completionRewards: 'fixed' },
    { government5: 'existing', completionRewards: 'difficulty' },
    { government5: 'any', completionRewards: 'difficulty' },
  ];

  test.each([2, 3, 4])('plays only legal moves to game over at %i players in every rule option, from seat 1 and 2', numPlayers => {
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

  test('changes only the tuned weights and leaves Balanced untouched', () => {
    expect(COUNTER.weights).toEqual({ ...BALANCED.weights, village: 0, tree: 0.6, unlock: 0, initiation: -1 });
    expect(COUNTER.nodeImpact).toBe(BALANCED.nodeImpact);
    expect(BALANCED.weights).toMatchObject({ village: 0.3, tree: 1, unlock: 0.5, initiation: 0 });
  });
});
