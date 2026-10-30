# 一般型 Normal in every seat: 72 room-option scenarios

`NODE_ENV=production`, Apple M4 with 10 cores, 2026-10-29. 648,000 complete
games, 0 failures. Recorded as Strategist (table `strategist`, seat letter
`S`). The run was stopped at 2,112 of 2,160 jobs and resumed for the last 48;
the manifest records the resumed build `67e61950`. The first jobs ran at
`02f24ea8`; the game and bot code are identical in both, and the renamed
profile at a later build reproduces 6,800 checked games of this run exactly.

## What was played

The same design and seeds as the [all-Advance sweep](../../advance/sweep72/README.md):
3 starter rotations × 3 extra-round settings × 4 tree presets × 2 completion
rewards = 72 scenarios, Government 5 `any`. 30 seed batches deal 100 games
per player count (2, 3 and 4), and every deal is replayed under all 72
scenarios, so each scenario has 3,000 games per player count and every
comparison with the Advance sweep is paired by seed.

Files: [manifest.json](manifest.json) and [analysis.json](analysis.json)
(same fields as the Advance sweep). To regenerate the per-game records and the
interactive report:

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables normal --batches 30 --runs 100 --out bot-runs/sweep72-normal
python3 scripts/analyze-standard-sweep.py bot-runs/sweep72-normal
python3 scripts/report-standard-sweep.py bot-runs/sweep72-normal
```

## Compared with Advance in every seat

| All 72 scenarios | Players | Normal | Advance |
| --- | --- | --- | --- |
| Tree nodes grown per game | 2 / 3 / 4 | 7.4 / 9.4 / 9.7 | 5.0 / 7.1 / 7.4 |
| Games with no tree growth | 2 / 3 / 4 | 0 / 0 / 0% | 16 / 10 / 13% |
| Games reaching tier 5 | 2 / 3 / 4 | 21 / 75 / 88% | 23 / 62 / 71% |
| Mean score | 2 / 3 / 4 | 58.1 / 63.1 / 59.1 | 56.9 / 58.1 / 52.4 |
| Seat spread, mean over scenarios | 2 / 3 / 4 | 8.7 / 17.5 / 16.2 pp | 4.5 / 7.0 / 9.5 pp |
| Ties | 2 / 3 / 4 | 3.8 / 5.0 / 5.5% | 4.0 / 6.2 / 7.7% |

## Seat balance

Ties split the win. *Spread* is the strongest seat's win rate minus the
weakest seat's; *Σ|dev|* adds every seat's distance from a fair share; both
are averaged over the scenarios that use the option. Chance alone gives a
spread of about 1.5–1.6 pp with 3,000 games (pp = percentage points).

| Players | Option | Spread | Σ\|dev\| |
| --- | --- | --- | --- |
| 4 | No rotation / clockwise / counter-clockwise | **9.4** / 18.2 / 20.9 pp | 12.5 / 26.1 / 28.0 pp |
| 4 | +0 / +1 / +2 rounds | 11.9 / 19.0 / 17.6 pp | 16.3 / 25.4 / 24.9 pp |
| 3 | No rotation / clockwise / counter-clockwise | 17.5 / 18.0 / 17.1 pp | 20.0 / 21.2 / 20.4 pp |
| 3 | +0 / +1 / +2 rounds | **12.3** / 14.3 / 26.1 pp | 13.9 / 16.5 / 31.3 pp |
| 2 | No rotation / clockwise / counter-clockwise | 10.1 / 8.0 / 8.0 pp | 10.1 / 8.0 / 8.0 pp |
| 2 | +0 / +1 / +2 rounds | 10.2 / 9.1 / 6.9 pp | 10.2 / 9.1 / 6.9 pp |

Tree presets span 13.9–19.3 pp at 4 players; the completion reward gives 14.9
(fixed) and 17.4 pp (by stars).

Seat win rates by rotation, averaged over the other options:

| Players | No rotation | Clockwise | Counter-clockwise |
| --- | --- | --- | --- |
| 4 | 20.7 / 24.6 / 26.9 / 27.7% | 18.2 / 23.9 / 32.0 / 26.0% | 24.8 / 18.5 / 23.9 / 32.8% |
| 3 | 24.8 / 33.0 / 42.2% | 29.0 / 31.7 / 39.2% | 30.0 / 30.7 / 39.3% |
| 2 | 45.9 / 54.1% | 51.0 / 49.0% | 51.0 / 49.0% |

Default room (no rotation, +0 rounds, Count 0/0/2/4/6, fixed rewards): 18.3 /
25.8 / 27.7 / 28.2% at 4 players, 25.0 / 33.4 / 41.6% at 3, 50.5 / 49.5% at 2.

When every seat invests in the tree, later seats win more, as in all-Novice
games; with Advance in every seat the default room is close to even.

## Star tree

Abilities grown per game (10 at most) and games reaching tier 5:

| Preset | 2 players | 3 players | 4 players |
| --- | --- | --- | --- |
| Count 0/0/2/4/6 | 7.45, 18% | 9.53, 81% | 9.86, 94% |
| CC 0/0/2/4/6 | 8.58, 55% | 9.92, 98% | 9.97, 99% |
| CC 0/0/3/6/9 | 6.95, 6% | 9.27, 70% | 9.69, 86% |
| CC 0/1/3/6/10 | 6.56, 3% | 8.87, 52% | 9.42, 73% |

## Projects by difficulty

Per game, all players together, averaged over the 72 scenarios:

| Players | 1★ played / completed | 2★ played / completed | 3★ and 4★ played | Advanced draws |
| --- | --- | --- | --- | --- |
| 2 | 4.86 / 3.07 | 3.59 / 2.07 | 0.009 | 0.08 |
| 3 | 7.28 / 5.65 | 5.07 / 3.56 | 0.025 | 0.28 |
| 4 | 9.34 / 7.60 | 6.10 / 4.40 | 0.053 | 1.30 |

Normal draws advanced cards at 4 players but almost never starts them: it
draws them late, when an entry card cannot be finished either.

## Limits

- Bot-only evidence for one strategy in every seat.
- The planner's `focus`, `helperShare` and `apValue` are untuned first
  guesses, and Normal loses to Advance head to head
  ([vs-advance](../vs-advance/README.md)), so this run describes a table of
  tree-investing players, not strong play.
- The draw estimate plans each card alone; it does not expect other players
  to join, which keeps 3★ and 4★ projects out of reach.
