/** One deterministic complete game per configuration, plus exact replay. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { runGame } from '../src/game/bots/runner';
import { createProfileBot } from '../src/game/bots/profileBot';
import { BALANCED } from '../src/game/bots/profiles';
import { normalizeStandardOptions, TREE_PRESETS } from '../src/game/standard/options';
import { treeProgress } from '../src/game/standard/tree';

const out = process.argv[2];
if (!out) throw new Error('Pass an output JSON path');
const build = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
const results = [];
const bots = createProfileBot(BALANCED);
for (const numPlayers of [2, 3, 4]) for (const starterRotation of ['none', 'clockwise', 'counterclockwise']) {
  for (const extraRounds of [0, 1, 2]) for (const treePreset of Object.keys(TREE_PRESETS)) {
    const standardOptions = normalizeStandardOptions({ starterRotation, extraRounds, treePreset });
    const key = `${numPlayers}p/${starterRotation}/extra-${extraRounds}/${treePreset}/fixed`;
    const seed = 'room-options-matrix-v1';
    const spec = { numPlayers, standardOptions, seed, bots };
    const run = runGame(spec);
    const replay = runGame(spec);
    assert.deepEqual(replay.moves, run.moves);
    assert.deepEqual(replay.state.G.table.scoreBoard, run.state.G.table.scoreBoard);
    assert.deepEqual(replay.state.G.standard!.log, run.state.G.standard!.log);
    assert.ok(run.state.ctx.gameover);
    assert.equal(run.state.G.standard!.round, 9 - numPlayers + extraRounds);
    const orders = Array.from({ length: run.state.G.standard!.round }, (_, i) => {
      const actual = Array.from(new Set(run.moves.filter(move => move.round === i + 1 && move.move !== 'resolveStandardChoice').map(move => move.playerID)));
      const offset = starterRotation === 'clockwise' ? i : starterRotation === 'counterclockwise' ? -i : 0;
      assert.deepEqual(actual, Array.from({ length: numPlayers }, (_, seat) => String(((seat + offset) % numPlayers + numPlayers) % numPlayers)));
      return actual;
    });
    results.push({ key, seed, standardOptions, experiments: run.state.G.standard!.experiments,
      rounds: run.state.G.standard!.round, orders, scores: run.state.G.table.scoreBoard,
      treeProgress: treeProgress(run.state.G), replayIdentical: true,
      moves: run.moves.length, movesSha256: createHash('sha256').update(JSON.stringify(run.moves)).digest('hex'),
    });
  }
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ build, dirty, games: results.length, replayGames: results.length, failures: 0, results }, null, 2) + '\n');
console.log(`${results.length} configurations and replays passed: ${out}`);
