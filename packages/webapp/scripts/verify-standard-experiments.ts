/** Reproducible rule scenarios and seeded full games; no live server or private data. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { FnContext } from 'boardgame.io';
import { initialState, runGame } from '../src/game/bots/runner';
import { createProfileBot } from '../src/game/bots/profileBot';
import { BALANCED } from '../src/game/bots/profiles';
import { advanceStandard, choiceOptions, enqueue, resolveStandardChoice } from '../src/game/standard/engine';
import { buildStandardExport } from '../src/game/standard/export';
import type { GameState } from '../src/game/store/store';

const games = [];
const scenarios = [];
for (const government5 of ['existing', 'any'] as const) {
  for (const completionRewards of ['fixed', 'difficulty'] as const) {
    const experiments = { government5, completionRewards };
    for (const numPlayers of [2, 3, 4]) {
      const run = runGame({ numPlayers, seed: `experiment-${numPlayers}`, bots: createProfileBot(BALANCED), experiments });
      assert.ok(run.state.ctx.gameover);
      games.push({ ...buildStandardExport(run.state.G, run.state.ctx, { build: 'local-experiments', now: run.state.G.standard!.finishedAt }), moves: run.moves.length });
    }
    const state = structuredClone(initialState(2, 'experiment-target', experiments));
    const G = state.G;
    G.standard!.choices = [];
    G.standard!.phase = 'settlement';
    G.players['0'].token.workers = 1;
    const slot = G.table.projectBoard[0];
    Object.assign(slot, { card: { id: 'target', name: '驗證專案', difficulty: 4, type: 'ignored', requirements: { 工程師: 2 } }, owner: '1', ownerToken: 1, lastContributor: '1', contributions: [{ jobName: '工程師', worker: '1', value: 1 }] });
    const context = { G, ctx: { ...state.ctx, currentPlayer: '0', playOrderPos: 0 }, playerID: '0', events: { setActivePlayers: () => {} } } as unknown as FnContext<GameState> & { playerID: string };
    enqueue(G, 'government5', '0', 'origin', 2);
    const options = choiceOptions(G, G.standard!.choices[0]);
    assert.equal(options.length, government5 === 'any' ? 1 : 0);
    const before = G.players['0'].token.workers;
    if (options.length) resolveStandardChoice(context, G.standard!.choices[0].id, options[0].target);
    const afterAllocation = G.players['0'].token.workers;
    advanceStandard(context);
    assert.equal(G.players['0'].token.workers, 1);
    assert.equal(G.table.scoreBoard['0'], government5 === 'any' ? 1 + (completionRewards === 'difficulty' ? 4 : 2) : 0);
    scenarios.push({ experiments, options, reserves: { before, afterAllocation, afterSettlement: G.players['0'].token.workers }, scores: G.table.scoreBoard, completed: G.standard!.completedProjectIds });
  }
}
const directory = 'docs/evidence/standard-experiments';
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/rule-scenarios.json`, JSON.stringify({ scenarios, games }, null, 2));
console.info(`Verified ${scenarios.length} deterministic rule scenarios and ${games.length} complete bot games.`);
