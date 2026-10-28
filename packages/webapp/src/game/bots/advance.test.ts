import { EXPERIMENT_SCENARIOS } from '@/game/standard/config';
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
  const cases = [2, 3, 4].flatMap(numPlayers => EXPERIMENT_SCENARIOS.flatMap(({ id, experiments }) =>
    ['0', '1'].map(seat => ({ numPlayers, id, experiments, seat }))));

  test.each(cases)('plays only legal moves to game over: $numPlayers players, rules $id, seat index $seat', ({ numPlayers, id, experiments, seat }) => {
    // The runner fails on the first move the game rejects.
    const run = runGame({ numPlayers, seed: `advance-legal-${id}`, bots: seated(numPlayers, seat), experiments, legacyExperiments: true });
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
