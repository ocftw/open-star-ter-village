# 進階型 Advance against 新手型 Novice

`NODE_ENV=production`, Apple M4 with 10 cores, 2026-10-29, build `ef310879`.
112,000 complete games, 0 failures, 8 minutes.

Every seat assignment of Novice and Advance: 4 tables at 2 players, 8 at 3,
16 at 4, including the all-Novice and all-Advance tables. Scenarios 0–7 of the
[72-scenario sweep](../sweep72/README.md) (no rotation, +0 rounds, all four
tree presets, both completion rewards), seed batches 1–5 of the same seeds,
100 deals per batch and player count: 4,000 games per table, every table
paired by deal. One game per table and seed, following the
[seeded testing rules](../../../../bot-testing.md#seeded-testing-rules).

This run replaces `vs-novice-1000` (Advance in seat 1 or 2 only, on an older
build) and the all-Novice `baseline-100`; both stay in git history at
`c75742d9`. Its all-Advance tables reproduce the matching games of the
72-scenario sweep, and its all-Novice tables those of
[Normal vs Novice](../../normal/vs-novice/README.md).

Files: [manifest.json](manifest.json), [summary.json](summary.json). To
regenerate:

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables all --scenarios 0-7 --batches 5 --runs 100 --out bot-runs/novice-advance
python3 scripts/summarize-seat-tables.py bot-runs/novice-advance
```

## Results

Win share per seat-game in tables that seat both profiles; ties split the
win, ± is two standard errors.

| Players | Fair share | Advance by seat | Novice by seat |
| --- | --- | --- | --- |
| 2 | 50% | 80.5 / 86.2% (±1.3) | 13.8 / 19.5% |
| 3 | 33.3% | 45.1 / 48.8 / 54.0% (±0.9) | 11.1 / 17.8 / 23.2% |
| 4 | 25% | 29.0 / 33.8 / 35.6 / 37.1% (±0.6) | 8.3 / 15.1 / 19.0 / 22.1% |

By how many Advance bots sit at a 4-player table:

| Advance bots | Each Advance wins | Advance wins the game |
| --- | --- | --- |
| 1 | 40.7% | 40.7% |
| 2 | 35.1% | 70.2% |
| 3 | 30.4% | 91.2% |

Same seat and deals, one Novice swapped for Advance: seat 1 rises from 11.5%
(NNNN) to 34.0% (ANNN); seat 4 from 35.9% to 43.0% (NNNA).

<details><summary>Every table</summary>

| Table (seat 1 first) | Win % by seat | Score by seat | Nodes grown |
| --- | --- | --- | --- |
| AA | 51.8 / 48.2 | 44.0 / 43.6 | 3.1 |
| AN | 80.5 / 19.5 | 51.9 / 44.7 | 6.8 |
| NA | 13.8 / 86.2 | 43.4 / 53.3 | 6.3 |
| NN | 41.1 / 58.9 | 42.8 / 45.1 | 6.3 |
| AAA | 33.8 / 33.2 / 33.0 | 41.8 / 41.5 / 41.3 | 5.0 |
| AAN | 44.0 / 40.5 / 15.6 | 48.5 / 48.5 / 43.8 | 8.5 |
| ANA | 37.5 / 11.9 / 50.5 | 48.5 / 43.4 / 50.1 | 8.4 |
| ANN | 53.9 / 17.5 / 28.6 | 47.9 / 42.8 / 45.1 | 8.5 |
| NAA | 6.9 / 46.5 / 46.6 | 41.4 / 49.8 / 49.7 | 8.1 |
| NAN | 15.2 / 59.5 / 25.3 | 41.7 / 48.6 / 44.5 | 8.4 |
| NNA | 11.1 / 24.0 / 64.9 | 40.8 / 44.4 / 49.0 | 8.2 |
| NNN | 21.2 / 37.5 / 41.3 | 41.2 / 43.7 / 44.1 | 8.2 |
| AAAA | 26.9 / 25.1 / 22.8 / 25.2 | 33.6 / 33.4 / 33.4 / 33.3 | 4.5 |
| AAAN | 28.4 / 27.5 / 31.1 / 13.0 | 40.8 / 41.0 / 41.3 / 37.3 | 8.9 |
| AANA | 25.7 / 27.7 / 9.7 / 36.9 | 40.7 / 41.1 / 37.0 / 42.0 | 8.8 |
| AANN | 30.1 / 31.2 / 15.0 / 23.7 | 40.8 / 41.1 / 38.0 / 39.8 | 9.0 |
| ANAA | 24.7 / 8.0 / 34.5 / 32.8 | 40.9 / 36.6 / 42.6 / 42.3 | 8.7 |
| ANAN | 30.3 / 12.0 / 37.4 / 20.2 | 40.8 / 37.3 / 41.9 / 39.1 | 9.0 |
| ANNA | 30.0 / 11.4 / 19.8 / 38.8 | 40.7 / 36.9 / 39.3 / 41.7 | 8.9 |
| ANNN | 34.0 / 13.9 / 23.4 / 28.7 | 40.4 / 37.1 / 39.2 / 39.9 | 9.0 |
| NAAA | 4.5 / 34.8 / 28.9 / 31.8 | 34.5 / 42.5 / 42.0 / 42.3 | 8.6 |
| NAAN | 8.2 / 37.2 / 36.7 / 17.8 | 36.0 / 41.8 / 41.9 / 38.5 | 9.0 |
| NANA | 7.5 / 36.3 / 18.2 / 38.0 | 35.3 / 41.7 / 39.2 / 42.0 | 8.9 |
| NANN | 9.3 / 42.1 / 21.7 / 26.9 | 36.0 / 41.8 / 38.9 / 39.8 | 8.9 |
| NNAA | 7.4 / 17.7 / 36.5 / 38.3 | 34.6 / 38.5 / 41.5 / 41.6 | 8.8 |
| NNAN | 11.2 / 20.5 / 43.6 / 24.7 | 35.9 / 38.3 / 41.4 / 38.8 | 8.9 |
| NNNA | 9.7 / 22.0 / 25.3 / 43.0 | 35.4 / 38.5 / 39.2 / 41.4 | 8.8 |
| NNNN | 11.5 / 23.4 / 29.3 / 35.9 | 35.8 / 38.4 / 39.4 / 40.3 | 8.9 |

</details>

Advance beats Novice from every seat, by more than Normal does
([Normal vs Novice](../../normal/vs-novice/README.md): 23.8 / 28.2 / 34.2 /
40.2% at 4 players). Tables with any Novice grow the tree to about 9 nodes;
all-Advance tables grow 4.5, and only there are the seats close to even.

## Limits

- Default room options only.
- Bot-only evidence; seat effects from human habits are not covered.
