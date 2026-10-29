/**
 * Full-factorial Standard sweep: every room option (3 rotations × 3 extra-round
 * settings × 4 tree presets × 2 completion rewards = 72 scenarios) against every
 * seat assignment of the two bot strategies (2^n per player count: 4 + 8 + 16),
 * or only the all-Advance table with `--tables advance`, the all-Normal table
 * with `--tables normal`, Normal in each seat against Advance with
 * `--tables normal-seat`, or every seat assignment of Novice and Normal with
 * `--tables novice-normal`. `--scenarios` limits a run to some scenario indexes.
 * Seeds are shared across scenarios and seat assignments, so every comparison is
 * paired. Work is split into (batch, scenario) jobs; finished jobs are skipped
 * on rerun, so an interrupted sweep resumes where it stopped.
 *
 *   NODE_ENV=production pnpm webapp exec tsx scripts/sweep-standard-scenarios.ts --batches 30 --runs 100
 *   NODE_ENV=production pnpm webapp exec tsx scripts/sweep-standard-scenarios.ts --tables advance --out bot-runs/sweep72-advance
 *   NODE_ENV=production pnpm webapp exec tsx scripts/sweep-standard-scenarios.ts --tables normal-seat --scenarios 0-7 --out bot-runs/normal-seat
 *
 * `--scenarios default` (or a comma list of scenario indexes and ranges such as
 * `0-7`) plays only those scenarios; job files keep their index in the full 72,
 * so seeds and results match the same scenario in a full sweep. See docs/bot-testing.md.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { createProfileBot } from '@/game/bots/profileBot';
import { ADVANCE, NORMAL, NOVICE } from '@/game/bots/profiles';
import { runGame } from '@/game/bots/runner';
import type { Bot } from '@/game/bots/types';
import type { StandardExperiments } from '@/game/standard/config';
import { normalizeStandardOptions, TREE_PRESETS, type StandardOptions } from '@/game/standard/options';
import { treeProgress } from '@/game/standard/tree';

const { values } = parseArgs({ options: {
  batches: { type: 'string', default: '30' },
  runs: { type: 'string', default: '100' },
  players: { type: 'string', default: '2,3,4' },
  seed: { type: 'string', default: 'sweep72-v1' },
  // `all`: every seat assignment of Novice and Advance; `advance` / `normal`: one profile in every seat;
  // `normal-seat`: Normal in one seat, Advance in the others, for every seat;
  // `novice-normal`: every seat assignment of Novice and Normal.
  tables: { type: 'string', default: 'all' },
  // `all`, `default` (the default room: scenario 0) or comma-separated indexes and ranges into the 72, e.g. `0-7`.
  scenarios: { type: 'string', default: 'all' },
  jobs: { type: 'string', default: String(availableParallelism()) },
  out: { type: 'string', default: 'bot-runs/sweep72' },
  child: { type: 'boolean', default: false },
} });

const batches = Number(values.batches);
const runs = Number(values.runs);
const jobCount = Number(values.jobs);
const playerCounts = values.players!.split(',').map(Number);
assert.ok(Number.isInteger(batches) && batches > 0 && Number.isInteger(runs) && runs > 0, 'batches and runs must be positive integers');
assert.ok(playerCounts.every(n => [2, 3, 4].includes(n)), 'players must be 2, 3 or 4');
assert.ok(['all', 'advance', 'normal', 'normal-seat', 'novice-normal'].includes(values.tables!),
  'tables must be all, advance, normal, normal-seat or novice-normal');

const ROTATIONS = ['none', 'clockwise', 'counterclockwise'] as const;
const REWARDS = ['fixed', 'difficulty'] as const;
interface Scenario { id: string; standardOptions: StandardOptions; experiments: StandardExperiments }
const SCENARIOS: Scenario[] = ROTATIONS.flatMap(starterRotation => ([0, 1, 2] as const).flatMap(extraRounds =>
  (Object.keys(TREE_PRESETS) as (keyof typeof TREE_PRESETS)[]).flatMap(treePreset => REWARDS.map(completionRewards => ({
    id: `${starterRotation}|x${extraRounds}|${treePreset}|${completionRewards}`,
    standardOptions: normalizeStandardOptions({ starterRotation, extraRounds, treePreset }),
    experiments: { government5: 'any', completionRewards },
  })))));
assert.equal(SCENARIOS.length, 72);
const scenarioIndexes = values.scenarios === 'all' ? SCENARIOS.map((_, i) => i)
  : values.scenarios === 'default' ? [0] : values.scenarios!.split(',').flatMap(part => {
    const [from, to = from] = part.split('-').map(Number);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  });
assert.ok(scenarioIndexes.length && scenarioIndexes.every(i => Number.isInteger(i) && i >= 0 && i < SCENARIOS.length), 'scenarios must be all, default or indexes 0-71');

/** Seat assignments as strings, seat 1 first: N = Novice, M = Normal, A = Advance. */
const combos = (n: number): string[] => {
  if (values.tables === 'advance') return ['A'.repeat(n)];
  if (values.tables === 'normal') return ['M'.repeat(n)];
  if (values.tables === 'normal-seat') return Array.from({ length: n }, (_, seat) => 'A'.repeat(seat) + 'M' + 'A'.repeat(n - seat - 1));
  const other = values.tables === 'novice-normal' ? 'M' : 'A';
  return Array.from({ length: 2 ** n }, (_, mask) =>
    Array.from({ length: n }, (_, seat) => (mask >> seat) & 1 ? other : 'N').join(''));
};

const jobFile = (out: string, batch: number, scenario: number) => join(out, `b${String(batch).padStart(2, '0')}`, `s${String(scenario).padStart(2, '0')}.jsonl.gz`);

/** Compact per-game record; seats are 0-based in arrays. */
function playGame(scenario: Scenario, numPlayers: number, combo: string, seed: string, bots: Record<string, Bot>) {
  const run = runGame({ numPlayers, seed, bots, experiments: scenario.experiments, standardOptions: scenario.standardOptions });
  const { G, ctx } = run.state;
  const s = G.standard!;
  const t = s.telemetry!;
  const seats = Array.from({ length: numPlayers }, (_, i) => String(i));
  const scores = seats.map(id => G.table.scoreBoard[id]);
  const winners = (ctx.gameover as { winners: string[] }).winners.map(Number);
  assert.deepEqual(winners, seats.filter(id => G.table.scoreBoard[id] === Math.max(...scores)).map(Number));
  assert.equal(s.round, 9 - numPlayers + scenario.standardOptions.extraRounds);
  assert.equal(s.choices.length, 0);
  const breakdown: Record<string, number[]> = {};
  for (const l of s.log) if (l.kind === 'score' && l.playerId !== undefined) {
    (breakdown[l.target ?? '?'] ??= seats.map(() => 0))[Number(l.playerId)] += l.scoreDelta ?? 0;
  }
  return {
    n: numPlayers, c: combo, seed, sc: scores, w: winners, rd: s.round, tp: treeProgress(G).value,
    // Growth order: [round, seat, node]; node is branch initial + tier, e.g. d3.
    g: s.log.filter(l => l.kind === 'grow').map(l => [l.round, Number(l.playerId), l.target![0] + l.target!.split('-')[1]]),
    // Projects: [stars, initiator, initiated round, finisher or -1, completed round or -1].
    p: Object.values(t.projects).map(p => [p.difficulty, Number(p.initiator), p.initiatedRound, p.finisher === undefined ? -1 : Number(p.finisher), p.completedRound ?? -1]),
    ad: seats.map(id => t.advancedDraws[id] ?? 0),
    f20: seats.map(id => t.firstOver20Round[id] ?? -1),
    g5: [t.government5.budget, t.government5.used],
    bd: breakdown,
    ev: s.log.filter(l => l.kind === 'event').map(l => l.target),
    mv: run.moves.length,
  };
}

function runJob(out: string, batch: number, scenarioIndex: number) {
  const scenario = SCENARIOS[scenarioIndex];
  const bots = { N: createProfileBot(NOVICE), M: createProfileBot(NORMAL), A: createProfileBot(ADVANCE) };
  const lines: string[] = [];
  let failures = 0;
  for (const n of playerCounts) for (let r = 0; r < runs; r++) {
    // The same seed across scenarios and seat assignments: deals, events and tie-break streams are paired.
    const seed = `${values.seed}-b${batch}-${n}p-r${r}`;
    for (const combo of combos(n)) {
      try {
        lines.push(JSON.stringify(playGame(scenario, n, combo, seed, Object.fromEntries(combo.split('').map((k, seat) => [String(seat), bots[k as keyof typeof bots]])))));
      } catch (error) {
        failures++;
        lines.push(JSON.stringify({ n, c: combo, seed, err: String((error as Error).message) }));
      }
    }
  }
  const file = jobFile(out, batch, scenarioIndex);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(`${file}.tmp`, gzipSync(lines.join('\n') + '\n'));
  renameSync(`${file}.tmp`, file);
  return { games: lines.length, failures };
}

if (values.child) {
  process.on('message', (message: { out: string; batch: number; scenario: number }) => {
    const result = runJob(message.out, message.batch, message.scenario);
    process.send!({ ...message, ...result });
  });
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
  const dirty = execFileSync('git', ['status', '--porcelain', '--', 'src'], { encoding: 'utf8' }).trim() !== '';
  const gamesPerJob = runs * playerCounts.reduce((sum, n) => sum + combos(n).length, 0);
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ build, uncommittedSrcChanges: dirty, nodeEnv: process.env.NODE_ENV,
    tables: values.tables, seedPrefix: values.seed, seeds: `${values.seed}-b<1..${batches}>-<players>p-r<0..${runs - 1}>`, batches, runsPerBatch: runs,
    playerCounts, combos: Object.fromEntries(playerCounts.map(n => [n, combos(n)])), scenarios: SCENARIOS, scenarioIndexes,
    gamesPerJob, totalGames: gamesPerJob * batches * scenarioIndexes.length,
    strategies: { N: { profile: 'novice', weights: NOVICE.weights }, A: { profile: 'advance', weights: ADVANCE.weights },
      M: { profile: 'normal', weights: NORMAL.weights, planner: NORMAL.planner } },
    method: 'Authoritative headless reducer; bots see only their own player view. Every seed is played under all 72 scenarios and every seat assignment. Government 5 is the current new-room rule (any).' }, null, 2));

  // Batch-major order: early batches complete across all scenarios first, so partial results are balanced.
  const queue: { batch: number; scenario: number }[] = [];
  for (let batch = 1; batch <= batches; batch++) for (const scenario of scenarioIndexes) {
    if (!existsSync(jobFile(out, batch, scenario))) queue.push({ batch, scenario });
  }
  const total = batches * scenarioIndexes.length;
  let done = total - queue.length;
  let failures = 0;
  const started = Date.now();
  const startDone = done;
  console.info(`${done}/${total} jobs already complete; ${queue.length} to run on ${jobCount} workers (${gamesPerJob} games each)`);

  const work = (child: ChildProcess) => new Promise<void>((finish, fail) => {
    const next = () => {
      const job = queue.shift();
      if (!job) { child.kill(); return finish(); }
      child.send({ out, ...job });
    };
    child.on('message', (result: { batch: number; scenario: number; failures: number }) => {
      done++;
      failures += result.failures;
      const rate = (done - startDone) / ((Date.now() - started) / 1000);
      const eta = queue.length / rate / 3600;
      writeFileSync(join(out, 'progress.json'), JSON.stringify({ done, total, failures, elapsedSeconds: (Date.now() - started) / 1000, etaHours: eta }) + '\n');
      console.info(`${done}/${total} b${result.batch} s${result.scenario} failures=${failures} eta=${eta.toFixed(2)}h`);
      next();
    });
    child.on('exit', code => { if (code && code !== 0 && code !== null) fail(new Error(`worker exited ${code}`)); });
    next();
  });
  await Promise.all(Array.from({ length: Math.min(jobCount, queue.length) }, () =>
    work(spawn(process.execPath, [...process.execArgv, process.argv[1], ...process.argv.slice(2), '--child'], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }))));
  console.info(`sweep complete: ${done}/${total} jobs, ${failures} failed games`);
  if (failures) process.exitCode = 1;
}
