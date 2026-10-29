import { createProfileBot } from './profileBot';
import { NOVICE, ADVANCE, type Weights } from './profiles';
import { runGame } from './runner';
import type { Bot } from './types';

const novice = createProfileBot(NOVICE);
const advance = createProfileBot(ADVANCE);

function seated(numPlayers: number, seat: string): Record<string, Bot> {
  return Object.fromEntries(Array.from({ length: numPlayers }, (_, i) => [String(i), String(i) === seat ? advance : novice]));
}

describe('advance profile', () => {
  // Rule-variant legality is covered by runner.test.ts; this checks Advance itself at each player count.
  test.each([2, 3, 4])('plays only legal moves to game over: %i players', numPlayers => {
    const seat = '0';
    // The runner fails on the first move the game rejects.
    const run = runGame({ numPlayers, seed: 'advance-legal', bots: seated(numPlayers, seat) });
    expect(run.state.ctx.gameover).toBeDefined();
    expect(run.moves.some(move => move.playerID === seat)).toBe(true);
  });

  test('replays the same game from the same seed', () => {
    const play = () => runGame({ numPlayers: 3, seed: 'advance-replay', bots: seated(3, '0') });
    const [first, second] = [play(), play()];
    expect(second.moves).toEqual(first.moves);
    expect(second.state.G.table.scoreBoard).toEqual(first.state.G.table.scoreBoard);
  });

  test('is Novice with only some weights changed', () => {
    const changed = (Object.keys(NOVICE.weights) as (keyof Weights)[]).filter(key => ADVANCE.weights[key] !== NOVICE.weights[key]);
    expect(changed.sort()).toEqual(['initiation', 'tree', 'unlock', 'village']);
    expect(ADVANCE.nodeImpact).toBe(NOVICE.nodeImpact);
  });
});
