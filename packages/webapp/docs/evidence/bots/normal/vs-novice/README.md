# 一般型 Normal against 新手型 Novice

`NODE_ENV=production`, Apple M4, 2026-10-29, build `67e61950`. 112,000
complete games, 0 failures. Recorded as Strategist (table
`novice-strategist`, seat letter `S`).

Every seat assignment of Novice and Normal: 4 tables at 2 players, 8 at 3,
16 at 4, including the all-Novice and all-Normal tables. Scenarios 0–7 of the
[72-scenario sweep](../../advance/sweep72/README.md) (no rotation, +0 rounds,
all four tree presets, both completion rewards), seed batches 1–5, 100 deals
per batch and player count: 4,000 games per table, all tables paired by deal.

Files: [manifest.json](manifest.json), [summary.json](summary.json). To
regenerate:

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables novice-normal --scenarios 0-7 --batches 5 --runs 100 --out bot-runs/novice-normal
python3 scripts/summarize-seat-tables.py bot-runs/novice-normal
```

## Results

Win share per seat-game in tables that seat both profiles; ties split the
win, ± is two standard errors.

| Players | Fair share | Normal by seat | Novice by seat |
| --- | --- | --- | --- |
| 2 | 50% | 57.5 / 67.6% (±1.6) | 32.4 / 42.5% |
| 3 | 33.3% | 35.3 / 43.2 / 47.9% (±0.9) | 15.2 / 25.8 / 32.5% |
| 4 | 25% | 23.8 / 28.2 / 34.2 / 40.2% (±0.6) | 9.1 / 16.4 / 21.0 / 27.1% |

By how many Normal bots sit at a 4-player table:

| Normal bots | Each Normal wins | Normal wins the game |
| --- | --- | --- |
| 1 | 37.4% | 37.4% |
| 2 | 32.6% | 65.2% |
| 3 | 28.6% | 85.9% |

Same seat and deals, one Novice swapped for Normal: seat 1 rises from 11.5%
(NNNN) to 29.9% (MNNN); seat 4 from 35.9% to 46.3% (NNNM).

<details><summary>Every table</summary>

| Table (seat 1 first) | Win % by seat | Score by seat | Nodes grown |
| --- | --- | --- | --- |
| NN | 41.1 / 58.9 | 42.8 / 45.1 | 6.3 |
| NM | 32.4 / 67.6 | 43.5 / 47.7 | 6.3 |
| MN | 57.5 / 42.5 | 47.1 / 45.5 | 6.8 |
| MM | 47.9 / 52.1 | 47.6 / 47.9 | 6.6 |
| NNN | 21.2 / 37.5 / 41.3 | 41.2 / 43.7 / 44.1 | 8.2 |
| NNM | 17.0 / 31.3 / 51.7 | 41.8 / 44.4 / 47.1 | 8.2 |
| NMN | 15.4 / 48.5 / 36.1 | 41.6 / 46.5 / 44.9 | 8.5 |
| MNN | 40.1 / 24.6 / 35.3 | 45.8 / 43.6 / 45.4 | 8.6 |
| NMM | 13.4 / 40.1 / 46.5 | 42.0 / 46.9 / 47.5 | 8.5 |
| MNM | 32.9 / 21.5 / 45.6 | 46.1 / 43.9 / 47.7 | 8.5 |
| MMN | 33.0 / 41.0 / 26.0 | 46.3 / 47.3 / 45.1 | 8.8 |
| MMM | 27.3 / 34.1 / 38.7 | 46.3 / 47.3 / 48.2 | 8.7 |
| NNNN | 11.5 / 23.4 / 29.3 / 35.9 | 35.8 / 38.4 / 39.4 / 40.3 | 8.9 |
| NNNM | 9.6 / 19.9 / 24.2 / 46.3 | 36.0 / 38.8 / 39.6 / 42.4 | 8.9 |
| NNMN | 9.8 / 19.6 / 41.2 / 29.3 | 36.1 / 38.6 / 41.7 / 39.8 | 9.0 |
| NMNN | 11.5 / 32.0 / 23.6 / 32.9 | 36.2 / 40.7 / 39.2 / 40.4 | 9.0 |
| MNNN | 29.9 / 16.6 / 24.0 / 29.5 | 40.1 / 37.8 / 39.4 / 40.2 | 9.0 |
| NNMM | 8.2 / 16.8 / 34.2 / 40.8 | 36.2 / 38.8 / 41.7 / 42.2 | 9.0 |
| NMNM | 8.4 / 28.2 / 20.0 / 43.4 | 36.2 / 40.9 / 39.5 / 42.7 | 9.0 |
| NMMN | 8.5 / 28.5 / 36.6 / 26.4 | 36.2 / 40.8 / 41.8 / 39.9 | 9.1 |
| MNNM | 22.9 / 14.5 / 21.6 / 41.0 | 40.0 / 37.8 / 39.6 / 42.3 | 9.0 |
| MNMN | 25.6 / 14.6 / 35.7 / 24.1 | 40.2 / 38.0 / 41.7 / 39.7 | 9.1 |
| MMNN | 25.1 / 29.3 / 18.5 / 27.0 | 40.0 / 40.9 / 38.6 / 40.0 | 9.1 |
| NMMM | 7.6 / 25.6 / 29.0 / 37.8 | 36.3 / 41.0 / 41.8 / 42.6 | 9.2 |
| MNMM | 20.7 / 13.2 / 30.9 / 35.2 | 40.2 / 38.2 / 41.9 / 42.3 | 9.1 |
| MMNM | 20.5 / 27.3 / 15.2 / 37.0 | 40.2 / 41.3 / 38.8 / 42.4 | 9.2 |
| MMMN | 21.8 / 26.5 / 31.4 / 20.4 | 40.0 / 41.0 / 41.5 / 39.2 | 9.2 |
| MMMM | 18.9 / 22.6 / 27.1 / 31.5 | 40.1 / 41.1 / 41.7 / 41.9 | 9.3 |

</details>

Normal beats Novice from every seat. Both profiles grow the tree in nearly
every game (8.9–9.3 nodes at 4 players), and in every mix the later seats win
more: a Normal bot in seat 1 against three Novices (29.9%) still wins less
often than a Novice in seat 4 of an all-Novice table (35.9%).

## Limits

- Default room options only.
- Normal's planner settings are untuned first guesses.
