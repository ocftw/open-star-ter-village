/** Paired seeds across all four Standard rule options. Writes compact replayable evidence. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { createProfileBot } from '@/game/bots/profileBot';
import { BALANCED } from '@/game/bots/profiles';
import { runGame } from '@/game/bots/runner';
import type { StandardExperiments } from '@/game/standard/config';
import { treeOutcome } from '@/game/standard/export';

const { values } = parseArgs({ options: {
  games: { type: 'string', default: '300' }, seed: { type: 'string', default: 'standard-factorial-v1' },
  out: { type: 'string', default: 'bot-runs/standard-factorial' },
} });
const games = Number(values.games);
assert.ok(Number.isInteger(games) && games > 0, 'games must be a positive integer');
const out = resolve(values.out!);
mkdirSync(out, { recursive: true });
const build = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const scenarios: { id: string; experiments: StandardExperiments }[] = [
  { id: 'A', experiments: { government5: 'existing', completionRewards: 'fixed' } },
  { id: 'B', experiments: { government5: 'any', completionRewards: 'fixed' } },
  { id: 'C', experiments: { government5: 'existing', completionRewards: 'difficulty' } },
  { id: 'D', experiments: { government5: 'any', completionRewards: 'difficulty' } },
];
const started = Date.now();
const bot = createProfileBot(BALANCED);
const records = [];
// Exact same seed prefix per player count, not per option: deals and events are paired.
for (const numPlayers of [2, 3, 4]) {
  for (const scenario of scenarios) {
    for (let i = 0; i < games; i++) {
      const seed = `${values.seed}-${numPlayers}p-${i}`;
      try {
        const run = runGame({ numPlayers, seed, bots: bot, experiments: scenario.experiments });
        const { G, ctx } = run.state;
        const s = G.standard!;
        const telemetry = s.telemetry!;
        const scores = Object.values(G.table.scoreBoard);
        const winners = (ctx.gameover as { winners: string[] }).winners;
        assert.deepEqual(winners, Object.keys(G.table.scoreBoard).filter(id => G.table.scoreBoard[id] === Math.max(...scores)));
        assert.equal(s.round, 9 - numPlayers);
        assert.equal(s.choices.length, 0);
        assert.equal(new Set(s.completedProjectIds).size, s.completedProjectIds.length);
        assert.ok(Object.values(G.players).every(p => p.token.workers >= 0));
        const roundActionOrder = Array.from({ length: s.round }, (_, round) => ({
          round: round + 1,
          players: Array.from(new Set(run.moves.filter(m => m.round === round + 1 && m.move !== 'resolveStandardChoice' && m.move !== 'discardExcessJobCards').map(m => m.playerID))),
        }));
        assert.ok(roundActionOrder.every(r => r.players.length === numPlayers));
        const completedProjects = s.completedProjectIds.map(id => ({ id, ...telemetry.projects[id] }));
        records.push({ scenario: scenario.id, experiments: scenario.experiments, numPlayers, seed,
          scores: G.table.scoreBoard, winners, rounds: s.round, moves: run.moves.length, roundActionOrder,
          completedProjects, grown: s.grown, growth: s.log.filter(l => l.kind === 'grow'),
          events: s.log.filter(l => l.kind === 'event').map(l => l.target),
          remainingHearts: 10 - s.grown.length, outcome: treeOutcome(10 - s.grown.length),
          government5: telemetry.government5, choices: telemetry.choices,
          advancedDraws: telemetry.advancedDraws, firstOver20Round: telemetry.firstOver20Round });
      } catch (error) {
        writeFileSync(join(out, 'failure.json'), JSON.stringify({ numPlayers, scenario, seed, error: String(error) }, null, 2));
        throw error; // Never silently drop failures from win-rate denominators.
      }
    }
    console.info(`${numPlayers}p ${scenario.id}: ${games} finished (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  }
}
writeFileSync(join(out, 'games.jsonl.gz'), gzipSync(records.map(r => JSON.stringify(r)).join('\n') + '\n'));
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ build, startedAt: new Date(started).toISOString(),
  finishedAt: new Date().toISOString(), seconds: (Date.now() - started) / 1000,
  seedPrefix: values.seed, gamesPerScenarioPerPlayerCount: games, playerCounts: [2, 3, 4],
  totalGames: records.length, failures: 0, scenarios, profile: BALANCED,
  method: 'Authoritative headless reducer; player-view-only Balanced bots; identical seed per player count across all four rule options. Ties split wins.' }, null, 2));
console.info(`${records.length} games saved to ${out}`);
