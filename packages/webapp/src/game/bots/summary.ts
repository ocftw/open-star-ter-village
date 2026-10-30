import { treeOutcome } from '@/game/standard/export';
import type { ChoiceKind, NodeId } from '@/game/standard/state';
import type { ChoiceTelemetry } from '@/game/standard/telemetry';
import { NODES } from '@/game/standard/tree';
import type { GameRun } from './runner';

const CHOICE_KINDS: ChoiceKind[] = ['digitalMinister', 'government4', 'source4', 'government5', 'extraRecruit', 'discard', 'draw'];

export interface PlayerCountSummary {
  numPlayers: number;
  games: number;
  avgMoves: number;
  score: { mean: number; min: number; median: number; max: number };
  avgWinningScore: number;
  avgWinningMargin: number;
  /** Share of games each seat won; ties split the win. */
  seatWinRate: Record<string, number>;
  /** Share of games where at least one node of tier 3/4/5 was grown. */
  tierReachRate: Record<'3' | '4' | '5', number>;
  avgRemainingHearts: number;
  outcomes: Record<string, number>;
  avgCompletions: number;
  completionsByDifficulty: Record<string, number>;
  advancedDraws: number;
  advancedCompletions: number;
  /** Mean round a player first passes 20 influence, over players who did. */
  avgFirstOver20Round: number | null;
  government5: { gamesUnlocked: number; budget: number; used: number };
  choices: Partial<Record<ChoiceKind, ChoiceTelemetry>>;
  nodeGrowthRate: Partial<Record<NodeId, number>>;
  neverGrown: NodeId[];
  neverQueuedChoices: ChoiceKind[];
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const round2 = (value: number) => Math.round(value * 100) / 100;

export function summarize(runs: GameRun[]): PlayerCountSummary[] {
  const byCount = new Map<number, GameRun[]>();
  for (const run of runs) byCount.set(run.numPlayers, [...(byCount.get(run.numPlayers) ?? []), run]);
  return Array.from(byCount.entries()).sort(([a], [b]) => a - b).map(([numPlayers, games]) => summarizeCount(numPlayers, games));
}

function summarizeCount(numPlayers: number, games: GameRun[]): PlayerCountSummary {
  const scores: number[] = [];
  const winning: number[] = [];
  const margins: number[] = [];
  const seatWins: Record<string, number> = {};
  const tierReach = { '3': 0, '4': 0, '5': 0 };
  const outcomes: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const nodeCounts: Partial<Record<NodeId, number>> = {};
  const choices: Partial<Record<ChoiceKind, ChoiceTelemetry>> = {};
  const firstOver20: number[] = [];
  const government5 = { gamesUnlocked: 0, budget: 0, used: 0 };
  let advancedDraws = 0;
  let advancedCompletions = 0;
  let completions = 0;
  let hearts = 0;

  for (const { state } of games) {
    const s = state.G.standard!;
    const t = s.telemetry!;
    const board = Object.values(state.G.table.scoreBoard);
    const sorted = [...board].sort((a, b) => b - a);
    scores.push(...board);
    winning.push(sorted[0]);
    margins.push(sorted[0] - (sorted[1] ?? sorted[0]));
    const winners = (state.ctx.gameover as { winners?: string[] } | undefined)?.winners ?? [];
    for (const seat of winners) seatWins[seat] = (seatWins[seat] ?? 0) + 1 / winners.length;
    for (const tier of ['3', '4', '5'] as const) if (s.grown.some(n => n.endsWith(`-${tier}`))) tierReach[tier]++;
    for (const node of s.grown) nodeCounts[node] = (nodeCounts[node] ?? 0) + 1;
    hearts += 10 - s.grown.length;
    const outcome = treeOutcome(10 - s.grown.length);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    completions += s.completedProjectIds.length;
    for (const id of s.completedProjectIds) {
      const difficulty = t.projects[id]?.difficulty ?? 0;
      byDifficulty[difficulty] = (byDifficulty[difficulty] ?? 0) + 1;
      if (difficulty > 2) advancedCompletions++;
    }
    advancedDraws += Object.values(t.advancedDraws).reduce((a, b) => a + b, 0);
    firstOver20.push(...Object.values(t.firstOver20Round));
    if (s.grown.includes('government-5')) government5.gamesUnlocked++;
    government5.budget += t.government5.budget;
    government5.used += t.government5.used;
    for (const [kind, stats] of Object.entries(t.choices) as [ChoiceKind, ChoiceTelemetry][]) {
      const total = (choices[kind] ??= { queued: 0, resolved: 0, skipped: 0, noTarget: 0 });
      total.queued += stats.queued;
      total.resolved += stats.resolved;
      total.skipped += stats.skipped;
      total.noTarget += stats.noTarget;
    }
  }

  const n = games.length;
  const sortedScores = [...scores].sort((a, b) => a - b);
  return {
    numPlayers,
    games: n,
    avgMoves: round2(mean(games.map(g => g.moves.length))),
    score: { mean: round2(mean(scores)), min: sortedScores[0], median: sortedScores[Math.floor(sortedScores.length / 2)], max: sortedScores[sortedScores.length - 1] },
    avgWinningScore: round2(mean(winning)),
    avgWinningMargin: round2(mean(margins)),
    seatWinRate: Object.fromEntries(Array.from({ length: numPlayers }, (_, i) => [String(i), round2((seatWins[String(i)] ?? 0) / n)])),
    tierReachRate: { '3': round2(tierReach['3'] / n), '4': round2(tierReach['4'] / n), '5': round2(tierReach['5'] / n) },
    avgRemainingHearts: round2(hearts / n),
    outcomes,
    avgCompletions: round2(completions / n),
    completionsByDifficulty: byDifficulty,
    advancedDraws,
    advancedCompletions,
    avgFirstOver20Round: firstOver20.length ? round2(mean(firstOver20)) : null,
    government5,
    choices,
    nodeGrowthRate: Object.fromEntries(NODES.map(node => [node, round2((nodeCounts[node] ?? 0) / n)])),
    neverGrown: NODES.filter(node => !nodeCounts[node]),
    neverQueuedChoices: CHOICE_KINDS.filter(kind => !choices[kind]?.queued),
  };
}

const CSV_COLUMNS = ['numPlayers', 'games', 'avgMoves', 'scoreMean', 'scoreMin', 'scoreMedian', 'scoreMax', 'avgWinningScore', 'avgWinningMargin',
  'tier3Reach', 'tier4Reach', 'tier5Reach', 'avgRemainingHearts', 'avgCompletions', 'advancedDraws', 'advancedCompletions', 'avgFirstOver20Round',
  'gov5GamesUnlocked', 'gov5Budget', 'gov5Used'];

export function summaryCsv(summaries: PlayerCountSummary[]): string {
  const rows = summaries.map(s => [s.numPlayers, s.games, s.avgMoves, s.score.mean, s.score.min, s.score.median, s.score.max, s.avgWinningScore, s.avgWinningMargin,
    s.tierReachRate['3'], s.tierReachRate['4'], s.tierReachRate['5'], s.avgRemainingHearts, s.avgCompletions, s.advancedDraws, s.advancedCompletions,
    s.avgFirstOver20Round ?? '', s.government5.gamesUnlocked, s.government5.budget, s.government5.used].join(','));
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n';
}
