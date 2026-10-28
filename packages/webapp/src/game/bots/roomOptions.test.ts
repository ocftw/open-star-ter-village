import { runGame } from './runner';
import { createProfileBot } from './profileBot';
import { BALANCED } from './profiles';
import { normalizeStandardOptions, TREE_PRESETS } from '../standard/options';

const bot = createProfileBot(BALANCED);
const cases = [2, 3, 4].flatMap(numPlayers => ['none', 'clockwise', 'counterclockwise'].flatMap(starterRotation =>
  [0, 1, 2].flatMap(extraRounds => Object.keys(TREE_PRESETS).map(treePreset => ({
    numPlayers, standardOptions: normalizeStandardOptions({ starterRotation, extraRounds, treePreset }),
  })))));

test.each(cases)('finishes configured game and uses actual round order: %j', ({ numPlayers, standardOptions }) => {
  const run = runGame({ numPlayers, standardOptions, seed: 'room-options-matrix-v1', bots: bot });
  const rounds = 9 - numPlayers + standardOptions.extraRounds;
  expect(run.state.ctx.gameover).toBeDefined();
  expect(run.state.G.standard!.round).toBe(rounds);
  expect(run.state.G.standard!.choices).toEqual([]);
  expect(run.state.G.standard!.options).toEqual(standardOptions);
  for (let round = 1; round <= rounds; round++) {
    const actual = Array.from(new Set(run.moves.filter(move => move.round === round && move.move !== 'resolveStandardChoice').map(move => move.playerID)));
    const offset = standardOptions.starterRotation === 'clockwise' ? round - 1 : standardOptions.starterRotation === 'counterclockwise' ? 1 - round : 0;
    const expected = Array.from({ length: numPlayers }, (_, seat) => String(((offset + seat) % numPlayers + numPlayers) % numPlayers));
    expect({ round, actual }).toEqual({ round, actual: expected });
  }
});
