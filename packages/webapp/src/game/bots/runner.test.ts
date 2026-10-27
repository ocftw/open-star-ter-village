import { createProfileBot } from './profileBot';
import { BALANCED } from './profiles';
import { randomBot } from './randomBot';
import { BotGameError, runGame } from './runner';
import type { Bot } from './types';

const balanced = createProfileBot(BALANCED);

describe('bot game runner', () => {
  test.each([2, 3, 4])('%i Balanced bots finish a full game in 9 − n rounds', numPlayers => {
    for (const seed of ['smoke-a', 'smoke-b']) {
      const run = runGame({ numPlayers, seed: `${seed}-${numPlayers}`, bots: balanced });
      expect(run.state.ctx.gameover).toBeDefined();
      expect(run.state.G.standard!.round).toBe(9 - numPlayers);
      expect(run.state.G.standard!.choices).toEqual([]);
      expect(Object.values(run.state.G.table.scoreBoard).every(score => score >= 0)).toBe(true);
    }
  });

  test('random bots also finish, as a rules fuzzer', () => {
    for (const numPlayers of [2, 3, 4]) expect(runGame({ numPlayers, seed: `fuzz-${numPlayers}`, bots: randomBot }).state.ctx.gameover).toBeDefined();
  });

  test('the same seed replays the identical move log', () => {
    const first = runGame({ numPlayers: 3, seed: 'replay', bots: balanced });
    const second = runGame({ numPlayers: 3, seed: 'replay', bots: balanced });
    expect(second.moves).toEqual(first.moves);
    expect(second.state.G.table.scoreBoard).toEqual(first.state.G.table.scoreBoard);
  });

  test('a rejected move fails the run with the seed and the move', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const cheater: Bot = { name: 'cheater', decide: () => ({ move: 'growTree', args: ['government-5', false] }) };
    expect(() => runGame({ numPlayers: 2, seed: 'reject', bots: cheater })).toThrow(BotGameError);
    expect(() => runGame({ numPlayers: 2, seed: 'reject', bots: cheater })).toThrow(/seed reject, step 0, \d growTree/);
  });

  test('a game that does not end within the step limit fails', () => {
    expect(() => runGame({ numPlayers: 2, seed: 'limit', bots: balanced, stepLimit: 5 })).toThrow(/did not end within 5 moves/);
  });
});


test.each([2, 3, 4])('%i bots finish all four experiment combinations', numPlayers => {
  for (const government5 of ['existing', 'any'] as const) {
    for (const completionRewards of ['fixed', 'difficulty'] as const) {
      const experiments = { government5, completionRewards };
      const run = runGame({ numPlayers, seed: `experiment-${numPlayers}`, bots: balanced, experiments });
      expect(run.state.ctx.gameover).toBeDefined();
      expect(run.state.G.standard!.experiments).toEqual(experiments);
      expect(Object.values(run.state.G.players).every(p => p.token.workers >= 0)).toBe(true);
    }
  }
});
