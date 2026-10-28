/**
 * Paired trials of a challenger strategy against Balanced. Every seed is played
 * all-Balanced and again with the challenger in one early seat, across all
 * four Standard rule options. Writes compact replayable evidence.
 *
 *   pnpm webapp exec tsx scripts/compare-bot-strategies.ts --challenger counter --games 300
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { createProfileBot } from '@/game/bots/profileBot';
import { BALANCED } from '@/game/bots/profiles';
import { runGame } from '@/game/bots/runner';
import { BOT_STRATEGIES, isBotStrategy } from '@/game/bots/strategies';
import type { Bot } from '@/game/bots/types';
import type { StandardExperiments } from '@/game/standard/config';
import { REWARDS } from '@/game/standard/tree';

const { values } = parseArgs({ options: {
  challenger: { type: 'string', default: 'counter' },
  games: { type: 'string', default: '300' },
  seed: { type: 'string', default: 'bot-strategies-v1' },
  players: { type: 'string', default: '2,3,4' },
  seats: { type: 'string', default: '1,2' },
  jobs: { type: 'string', default: String(availableParallelism()) },
  out: { type: 'string', default: 'bot-runs/bot-strategies' },
  // Internal: run one player count and scenario, writing JSONL to this file.
  job: { type: 'string' },
} });

const SCENARIOS: { id: string; experiments: StandardExperiments }[] = [
  { id: 'A', experiments: { government5: 'existing', completionRewards: 'fixed' } },
  { id: 'B', experiments: { government5: 'any', completionRewards: 'fixed' } },
  { id: 'C', experiments: { government5: 'existing', completionRewards: 'difficulty' } },
  { id: 'D', experiments: { government5: 'any', completionRewards: 'difficulty' } },
];
const games = Number(values.games);
assert.ok(Number.isInteger(games) && games > 0, 'games must be a positive integer');
assert.ok(isBotStrategy(values.challenger) && values.challenger !== 'balanced', `challenger must be a registered strategy other than balanced: ${Object.keys(BOT_STRATEGIES).join(', ')}`);
const challengerStrategy = BOT_STRATEGIES[values.challenger];
const playerCounts = values.players!.split(',').map(Number);
const seats = values.seats!.split(',').map(Number);
assert.ok(playerCounts.every(n => [2, 3, 4].includes(n)), 'players must be 2, 3 or 4');
assert.ok(seats.every(seat => Number.isInteger(seat) && seat >= 1 && seat <= Math.min(...playerCounts)), 'seats are 1-based and must exist at every player count');

/** One game's record: arm `balanced` is the all-Balanced baseline; seats are 1-based. */
function playGame(numPlayers: number, scenario: typeof SCENARIOS[number], seed: string, challengerSeat: number | null, bots: Record<string, Bot>) {
  const started = performance.now();
  const run = runGame({ numPlayers, seed, bots, experiments: scenario.experiments });
  const ms = performance.now() - started;
  const { G, ctx } = run.state;
  const s = G.standard!;
  const telemetry = s.telemetry!;
  const scores = Object.values(G.table.scoreBoard);
  const winners = (ctx.gameover as { winners: string[] }).winners;
  assert.deepEqual(winners, Object.keys(G.table.scoreBoard).filter(id => G.table.scoreBoard[id] === Math.max(...scores)));
  assert.equal(s.round, 9 - numPlayers);
  assert.equal(s.choices.length, 0);
  assert.ok(Object.values(G.players).every(p => p.token.workers >= 0));
  const players = Object.keys(G.table.scoreBoard).map(id => {
    const opened = Object.values(telemetry.projects).filter(p => p.initiator === id);
    return {
      seat: Number(id) + 1,
      strategy: String(Number(id) + 1) === String(challengerSeat) ? values.challenger : 'balanced',
      score: G.table.scoreBoard[id],
      openedByStar: countByStar(opened.map(p => p.difficulty)),
      completedByStar: countByStar(opened.filter(p => p.finisher !== undefined).map(p => p.difficulty)),
      finishedByStar: countByStar(Object.values(telemetry.projects).filter(p => p.finisher === id).map(p => p.difficulty)),
      cubePoints: Object.values(telemetry.projects).reduce((sum, p) => sum + (p.contributions?.[id] ?? 0), 0),
      treePoints: s.log.filter(l => l.kind === 'grow' && l.playerId === id).reduce((sum, l) => sum + REWARDS[Number(l.target!.split('-')[1]) - 1], 0),
      grown: s.log.filter(l => l.kind === 'grow' && l.playerId === id).length,
      advancedDraws: telemetry.advancedDraws[id] ?? 0,
      refills: run.moves.filter(m => m.playerID === id && m.move === 'removeAndRefillJobs').length,
    };
  });
  return { scenario: scenario.id, numPlayers, seed, arm: challengerSeat === null ? 'balanced' : values.challenger, challengerSeat,
    scores: G.table.scoreBoard, winners, moves: run.moves.length, ms: Math.round(ms * 10) / 10,
    events: s.log.filter(l => l.kind === 'event').map(l => l.target), players };
}

function countByStar(difficulties: number[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of difficulties) counts[d] = (counts[d] ?? 0) + 1;
  return counts;
}

function runJob(numPlayers: number, scenario: typeof SCENARIOS[number], file: string) {
  const balanced = createProfileBot(BALANCED);
  const challenger = challengerStrategy.createBot(challengerStrategy.profile);
  const lines: string[] = [];
  for (let i = 0; i < games; i++) {
    // The same seed per player count across options and arms: deals, events and Balanced tie-breaks are paired.
    const seed = `${values.seed}-${numPlayers}p-${i}`;
    for (const challengerSeat of [null, ...seats]) {
      const bots = Object.fromEntries(Array.from({ length: numPlayers }, (_, seat) => [String(seat), seat + 1 === challengerSeat ? challenger : balanced]));
      lines.push(JSON.stringify(playGame(numPlayers, scenario, seed, challengerSeat, bots)));
    }
  }
  writeFileSync(file, lines.join('\n') + '\n');
}

if (values.job) {
  const [numPlayers, scenarioId, file] = values.job.split(':');
  runJob(Number(numPlayers), SCENARIOS.find(s => s.id === scenarioId)!, file);
} else {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

async function main() {
  const out = resolve(values.out!);
  mkdirSync(out, { recursive: true });
  const build = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = execFileSync('git', ['status', '--porcelain', '--', 'src', 'scripts'], { encoding: 'utf8' }).trim() !== '';
  const scratch = mkdtempSync(join(tmpdir(), 'bot-strategies-'));
  const jobs = playerCounts.flatMap(n => SCENARIOS.map(scenario => ({ n, scenario, file: join(scratch, `${n}p-${scenario.id}.jsonl`) })));
  const started = Date.now();
  // Each job is a child process; seeding makes the result independent of the job count.
  const runChild = (job: typeof jobs[number]) => new Promise<void>((done, fail) => {
    const args = [...process.execArgv, process.argv[1], ...process.argv.slice(2), '--job', `${job.n}:${job.scenario.id}:${job.file}`];
    spawn(process.execPath, args, { stdio: 'inherit' }).on('exit', code => {
      if (code !== 0) return fail(new Error(`${job.n}p ${job.scenario.id} failed (exit ${code}); no evidence written`));
      console.info(`${job.n}p ${job.scenario.id}: ${games} seeds × ${1 + seats.length} arms (${((Date.now() - started) / 1000).toFixed(1)}s)`);
      done();
    });
  });
  const queue = [...jobs];
  await Promise.all(Array.from({ length: Math.max(1, Number(values.jobs)) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await runChild(job);
  }));
  const records = jobs.flatMap(job => readFileSync(job.file, 'utf8').trim().split('\n'));
  rmSync(scratch, { recursive: true });
  writeFileSync(join(out, 'games.jsonl.gz'), gzipSync(records.join('\n') + '\n'));
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ build, uncommittedChanges: dirty,
    startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), seconds: (Date.now() - started) / 1000,
    seedPrefix: values.seed, seeds: `${values.seed}-<players>p-<0..${games - 1}>`, gamesPerSeedSet: games,
    playerCounts, challengerSeats: seats, scenarios: SCENARIOS, totalGames: records.length, failures: 0,
    challenger: { strategy: values.challenger, label: challengerStrategy.label, profile: challengerStrategy.profile },
    baseline: { strategy: 'balanced', profile: BALANCED },
    method: 'Authoritative headless reducer; bots see only their own player view. Each seed is played all-Balanced and once per challenger seat with Balanced in every other seat; seats are 1-based. Ties split wins.' }, null, 2));
  console.info(`${records.length} games saved to ${out}`);
}
