/**
 * Batch bot games for Standard mode.
 *
 *   pnpm webapp bots --players 2,3,4 --games 100 --profile novice
 *   pnpm webapp bots --profile advance
 *
 * Writes per-game exports (with telemetry), move logs and a summary to
 * bot-runs/<timestamp>/ and prints the summary table.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { normalizeStandardOptions } from '@/game/standard/options';
import { buildStandardExport } from '@/game/standard/export';
import { createProfileBot } from '@/game/bots/profileBot';
import { PROFILES, withWeights, type Weights } from '@/game/bots/profiles';
import { BotGameError, runGame, type GameRun } from '@/game/bots/runner';
import { summarize, summaryCsv } from '@/game/bots/summary';

const { values } = parseArgs({
  options: {
    players: { type: 'string', default: '2,3,4' },
    games: { type: 'string', default: '100' },
    seed: { type: 'string', default: 'bots' },
    profile: { type: 'string', default: 'novice' },
    weights: { type: 'string' },
    out: { type: 'string' },
    'no-move-log': { type: 'boolean', default: false },
    rotation: { type: 'string', default: 'none' },
    'extra-rounds': { type: 'string', default: '0' },
    'tree-preset': { type: 'string', default: 'count-00246' },
    rewards: { type: 'string', default: 'fixed' },
  },
});

const base = PROFILES[values.profile!];
if (!base) throw new Error(`Unknown profile "${values.profile}". Available: ${Object.keys(PROFILES).join(', ')}`);
const profile = values.weights ? withWeights(base, JSON.parse(values.weights) as Partial<Weights>) : base;
const bot = createProfileBot(profile);
const playerCounts = values.players!.split(',').map(Number);
const games = Number(values.games);
if (!Number.isInteger(games) || games < 1 || playerCounts.some(count => ![2, 3, 4].includes(count))) throw new Error('Require positive integer games and 2–4 players');
if (!['fixed', 'difficulty'].includes(values.rewards!)) throw new Error('Invalid rewards');
const standardOptions = normalizeStandardOptions({ starterRotation: values.rotation, extraRounds: Number(values['extra-rounds']), treePreset: values['tree-preset'] });
const experiments = { government5: 'any' as const, completionRewards: values.rewards as 'fixed' | 'difficulty' };
const build = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const outDir = resolve(values.out ?? join('bot-runs', new Date().toISOString().replace(/[:.]/g, '-')));
mkdirSync(join(outDir, 'games'), { recursive: true });
if (!values['no-move-log']) mkdirSync(join(outDir, 'moves'), { recursive: true });

const runs: GameRun[] = [];
const failures: { seed: string; numPlayers: number; error: string }[] = [];
const started = Date.now();
for (const numPlayers of playerCounts) {
  for (let i = 0; i < games; i++) {
    const seed = `${values.seed}-${numPlayers}p-${i}`;
    try {
      const run = runGame({ numPlayers, seed, bots: bot, standardOptions, experiments });
      runs.push(run);
      const summary = buildStandardExport(run.state.G, run.state.ctx, { build, telemetry: run.state.G.standard!.telemetry });
      writeFileSync(join(outDir, 'games', `${seed}.json`), JSON.stringify({ seed, profile: profile.name, ...summary }, null, 2));
      if (!values['no-move-log']) writeFileSync(join(outDir, 'moves', `${seed}.jsonl`), run.moves.map(m => JSON.stringify(m)).join('\n') + '\n');
    } catch (error) {
      if (!(error instanceof BotGameError)) throw error;
      failures.push({ seed, numPlayers, error: error.message });
    }
  }
}
const seconds = (Date.now() - started) / 1000;

const summaries = summarize(runs);
writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ build, standardOptions, experiments, profile, playerCounts, gamesPerCount: games, seconds, failures, summaries }, null, 2));
writeFileSync(join(outDir, 'summary.csv'), summaryCsv(summaries));
if (failures.length) writeFileSync(join(outDir, 'failures.json'), JSON.stringify(failures, null, 2));

console.log(`Profile ${profile.name}: ${runs.length} games in ${seconds.toFixed(1)}s, ${failures.length} failed → ${outDir}`);
console.table(Object.fromEntries(summaries.map(s => [`${s.numPlayers}p`, {
  games: s.games,
  'score mean': s.score.mean,
  'winner avg': s.avgWinningScore,
  margin: s.avgWinningMargin,
  completions: s.avgCompletions,
  hearts: s.avgRemainingHearts,
  'tier3/4/5': `${s.tierReachRate['3']}/${s.tierReachRate['4']}/${s.tierReachRate['5']}`,
  'adv draws/done': `${s.advancedDraws}/${s.advancedCompletions}`,
  'gov5 used/budget': `${s.government5.used}/${s.government5.budget}`,
}])));
for (const s of summaries) {
  console.log(`${s.numPlayers}p seat win rate ${JSON.stringify(s.seatWinRate)}; never grown: ${s.neverGrown.join(', ') || 'none'}; choices never queued: ${s.neverQueuedChoices.join(', ') || 'none'}`);
}
if (failures.length) process.exitCode = 1;
