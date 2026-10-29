# Tree v2 balance sweep: v1 vs v2-collab vs v2-maintenance

Build `38e84acc` (tree v2 rules #473 and bots #474 merged), `NODE_ENV=production`,
Apple M4 with 10 cores, 2026-10-30. 72,000 complete games, 0 failures,
about 5 minutes.

## What was played

- Room scenarios 0–7 of the 72: no starter rotation, no extra rounds, all four
  tree presets × both completion rewards. Government 5 `any`.
- Every scenario under each tree rule: `v1`, `v2-collab`, `v2-maintenance`.
- Two tables: Advance in every seat, and Normal in every seat.
- 5 seed batches × 100 deals × 2, 3 and 4 players. Seeds are
  `sweep72-v1-b<1..5>-<players>p-r<0..99>`, the same deals as the 72-scenario
  sweeps, and every deal is replayed under all three tree rules, so tree-rule
  comparisons are paired. Each cell (table × rule × player count) pools 8
  scenarios × 500 games = 4,000 games.

Files: `advance/` and `normal/` each hold `manifest.json` (build, seeds,
scenarios, weights) and `analysis.json` (per scenario and player count). Per-game
records are not committed; the commands below regenerate them exactly.

```sh
cd packages/webapp
for t in advance normal; do
  NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
    --tables $t --tree-rules all --scenarios 0-7 --batches 5 --runs 100 --out bot-runs/tree-v2-$t
  python3 scripts/analyze-standard-sweep.py bot-runs/tree-v2-$t
  python3 scripts/report-standard-sweep.py bot-runs/tree-v2-$t
done
```

## Results

Means over the 8 scenarios. Spread is the largest gap between a seat's win rate
and 1/n; one scenario's seat win rate has a standard error of about 2 points.
`v2-collab` and `v2-maintenance` differ only in Government 2.

### Advance in every seat

| Players | Rule | Winning score | Seat spread | 1★ done | 2★ done | 3★/4★ played | Grown | Gov 1 | Gov 2 | Source 3 | Source 4 | Contract points |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | v1 | 47.7 | 2.1 | 2.52 | 1.31 | 0.00 | 3.14 | 0% | 0% | 30% | 22% | 0 |
| 2 | v2-collab | 50.5 | 1.9 | 2.73 | 1.43 | 0.00 | 3.28 | 31% | 13% | 51% | 14% | 0 |
| 2 | v2-maintenance | 50.2 | 1.6 | 2.72 | 1.41 | 0.00 | 3.40 | 32% | 37% | 51% | 14% | 0 |
| 3 | v1 | 46.4 | 1.8 | 3.61 | 2.06 | 0.00 | 4.98 | 0% | 0% | 40% | 56% | 0 |
| 3 | v2-collab | 51.5 | 2.4 | 4.07 | 2.34 | 0.00 | 4.92 | 37% | 21% | 68% | 38% | 0 |
| 3 | v2-maintenance | 51.4 | 3.1 | 4.07 | 2.33 | 0.00 | 4.97 | 37% | 42% | 68% | 38% | 0 |
| 4 | v1 | 38.7 | 3.6 | 3.83 | 2.22 | 0.00 | 4.47 | 0% | 0% | 33% | 53% | 0 |
| 4 | v2-collab | 42.4 | 3.5 | 4.30 | 2.49 | 0.00 | 4.45 | 29% | 13% | 58% | 40% | 0 |
| 4 | v2-maintenance | 42.4 | 3.7 | 4.30 | 2.49 | 0.00 | 4.47 | 29% | 31% | 59% | 40% | 0 |

### Normal in every seat

| Players | Rule | Winning score | Seat spread | 1★ done | 2★ done | 3★/4★ played | Grown | Gov 1 | Gov 2 | Source 3 | Source 4 | Seat win rates |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | v1 | 51.4 | 3.6 | 2.50 | 1.63 | 0.00 | 6.56 | 0% | 0% | 82% | 33% | 47.9 / 52.1 |
| 2 | v2 (both) | 51.8 | 4.5 | 2.51 | 1.58 | 0.00 | 6.51 | 0% | 0% | 96% | 23% | 46.7 / 53.3 |
| 3 | v1 | 52.8 | 7.0 | 4.21 | 2.42 | 0.00 | 8.67 | 0% | 0% | 89% | 82% | 27.3 / 34.1 / 38.7 |
| 3 | v2 (both) | 55.7 | 10.0 | 4.59 | 2.43 | 0.00 | 8.64 | 0% | 0% | 100% | 61% | 24.8 / 33.2 / 42.0 |
| 4 | v1 | 48.1 | 8.1 | 5.57 | 2.49 | 0.00 | 9.27 | 0% | 0% | 92% | 91% | 18.9 / 22.6 / 27.1 / 31.5 |
| 4 | v2 (both) | 52.9 | 12.8 | 6.15 | 2.76 | 0.03 | 9.26 | 0% | 0% | 100% | 69% | 13.5 / 20.7 / 29.8 / 36.1 |

Under Normal, `v2-collab` and `v2-maintenance` produce identical games: Normal
never grows Government 2, so the two rules never diverge.

## Findings

1. **The contracts and the lower gate never come into play.** No game in
   either table played a meaningful number of 3★/4★ projects (at most 0.03 per
   game), so neither contract paid a single point. This matches the v1 baseline:
   the 72-scenario Advance sweep played 0.007 advanced projects per game. Advance
   values an advanced draw at −0.5, and Normal's planner prices advanced cards
   below entry cards because it rarely expects to finish them. Advance grows
   Government 2 (13–42%) only from its flat impact estimate; Normal grows
   neither Government 1 nor 2, because its explicit valuations find nothing to
   gain.
2. **Connections plus Source 3 raise scores.** v2 raises the winning score by
   0.4–5.1 points and completes more 1★ and 2★ projects, mostly from contribution
   points. Source 3 is grown far more often (Normal: 100% of 3- and 4-player
   games). Source 4 is grown less often, likely because v2 no longer needs it to
   reach the next tier.
3. **v2 widens Normal's seat imbalance.** With Normal in every seat, the
   4-player seat spread rises from 8.1 to 12.8 points: seat 1 wins 13.5% instead
   of 18.9%, and seat 4 wins 36.1% instead of 31.5%. The 3-player spread rises from
   7.0 to 10.0. Advance's spread does not change beyond noise.

## Limitations

- The contracts cannot be judged with these bots, because no bot plays 3★/4★
  projects. A conclusion about Government 2 needs either bots that pursue
  advanced projects or rules that make advanced projects finishable.
- Only room scenarios 0–7 were played: no starter rotation and no extra rounds.
  Seat imbalance in the other 64 scenarios may differ.
