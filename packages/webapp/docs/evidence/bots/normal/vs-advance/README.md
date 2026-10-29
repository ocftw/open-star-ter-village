# 一般型 Normal against 進階型 Advance

`NODE_ENV=production`, Apple M4, 2026-10-29, build `471093f0`. 36,000
complete games, 0 failures. Recorded as Strategist (table `strategist-seat`,
seat letter `S`).

Normal sits in one seat and Advance in every other, for every seat: 2 tables
at 2 players, 3 at 3, 4 at 4. Scenarios 0–7 of the
[72-scenario sweep](../../advance/sweep72/README.md) (no rotation, +0 rounds,
all four tree presets, both completion rewards), seed batches 1–5 of the same
seeds, 100 deals per batch and player count: 4,000 games per table. The
matching all-Advance games are in that sweep, so every table is paired with
an all-Advance game on the same deal.

Files: [manifest.json](manifest.json), [summary.json](summary.json) (per table:
win share and mean score per seat, nodes grown; per profile: win share by
seat). To regenerate:

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables normal-seat --scenarios 0-7 --batches 5 --runs 100 --out bot-runs/normal-seat
python3 scripts/summarize-seat-tables.py bot-runs/normal-seat
```

## Results

Ties split the win; ± is two standard errors.

| Players | Fair share | Normal by seat | Normal overall | Advance in that seat, all-Advance games |
| --- | --- | --- | --- | --- |
| 2 | 50% | 29.4 / 33.3% (±1.5) | 31.3% | 51.8 / 48.2% |
| 3 | 33.3% | 19.7 / 23.1 / 28.0% (±1.4) | 23.6% | 33.8 / 33.2 / 33.0% |
| 4 | 25% | 15.8 / 17.8 / 18.5 / 23.9% (±1.3) | 19.0% | 26.9 / 25.1 / 22.8 / 25.2% |

| Table (seat 1 first) | Win % by seat | Score by seat | Nodes grown |
| --- | --- | --- | --- |
| MA | 29.4 / 70.6 | 46.3 / 51.2 | 6.3 |
| AM | 66.7 / 33.3 | 50.7 / 46.7 | 6.5 |
| MAA | 19.7 / 39.6 / 40.7 | 44.8 / 48.1 / 48.2 | 8.2 |
| AMA | 34.0 / 23.1 / 42.9 | 46.8 / 45.4 / 47.9 | 8.2 |
| AAM | 35.8 / 36.2 / 28.0 | 46.6 / 46.8 / 45.4 | 8.2 |
| MAAA | 15.8 / 28.3 / 26.7 / 29.2 | 37.0 / 39.5 / 39.1 / 39.3 | 8.3 |
| AMAA | 22.6 / 17.8 / 29.7 / 29.8 | 38.5 / 37.4 / 39.6 / 39.5 | 8.3 |
| AAMA | 22.9 / 23.8 / 18.5 / 34.8 | 39.0 / 39.3 / 38.2 / 40.4 | 8.6 |
| AAAM | 24.8 / 25.2 / 26.1 / 23.9 | 38.6 / 38.8 / 38.8 / 38.2 | 8.5 |

Normal loses from every seat and loses least from the last seat. It grows
most of the tree in these games (4.5–5.2 nodes per game against 1.4–3.9 for
all Advance seats together); every player gets the abilities, and Advance
opponents score about 39 points at 4 players against 33 in all-Advance games.

## Limits

- Default room options only.
- Normal's planner settings are untuned first guesses.
