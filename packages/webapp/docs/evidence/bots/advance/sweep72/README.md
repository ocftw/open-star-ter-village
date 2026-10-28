# 進階型 Advance in every seat: 72 room-option scenarios

Build `3d97d1bb`, `NODE_ENV=production`, Apple M4 with 10 cores,
2026-10-28. 648,000 complete games, 0 failures, 71 minutes.

## What was played

Every Standard room option combination, with Advance bots in every seat:

- Starter rotation: none, clockwise, counter-clockwise
- Extra rounds: 0, 1, 2
- Tree preset: Count 0/0/2/4/6, CC 0/0/2/4/6, CC 0/0/3/6/9, CC 0/1/3/6/10
- Completion reward: fixed +2/+2, or by stars +1–4
- Government 5: `any` (the current rule for new rooms)

That is 3 × 3 × 4 × 2 = 72 scenarios. 30 seed batches each deal 100 games per
player count (2, 3 and 4), and every deal is replayed under all 72 scenarios,
so scenario comparisons are paired. Each scenario has 3,000 games per player
count.

Advance replaced Novice for this run because Novice is too naive to judge seat
balance: in all-Novice games earlier seats set up projects that later seats
finish, so the last seat wins most (see [the Novice notes](../../novice/README.md)).

Files: [manifest.json](manifest.json) (build, seeds, scenarios, weights) and
[analysis.json](analysis.json) (per scenario and player count: seat win rates
with standard errors across batches, scores, tree growth per ability and round,
projects played and completed by stars, score sources). The 68 MB of per-game
records are not committed; the command below regenerates them exactly.

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables advance --batches 30 --runs 100 --out bot-runs/sweep72-advance
python3 scripts/analyze-standard-sweep.py bot-runs/sweep72-advance
python3 scripts/report-standard-sweep.py bot-runs/sweep72-advance
```

The last step writes `report.html`, an interactive heat map of all 72
scenarios with per-option effects, seat charts, the star tree and projects.

## Seat balance

Ties split the win. *Spread* is the strongest seat's win rate minus the
weakest seat's; *Σ|dev|* adds every seat's distance from a fair share. Both
are averaged over the scenarios that use the option. With 3,000 games, chance
alone gives a spread of about 1.6 pp at 4 players, 1.5 pp at 3 and 1.5 pp at
2 (pp = percentage points).

| Players | Option | Spread | Σ\|dev\| |
| --- | --- | --- | --- |
| 4 | No rotation | **4.9 pp** | 6.4 pp |
| 4 | Clockwise | 11.3 pp | 16.3 pp |
| 4 | Counter-clockwise | 12.1 pp | 16.9 pp |
| 4 | +0 / +1 / +2 rounds | 6.4 / 11.1 / 11.0 pp | 8.8 / 15.9 / 14.7 pp |
| 3 | No rotation / CW / CCW | 7.3 / 7.0 / 6.7 pp | 8.4 / 8.3 / 7.9 pp |
| 3 | +0 / +1 / +2 rounds | **3.9** / 6.9 / 10.2 pp | 4.6 / 7.8 / 12.2 pp |
| 2 | No rotation / CW / CCW | 5.5 / 3.9 / 3.9 pp | 5.5 / 3.9 / 3.9 pp |
| 2 | +0 / +1 / +2 rounds | 4.3 / 3.6 / 5.4 pp | 4.3 / 3.6 / 5.4 pp |

Tree preset changes the 4-player spread by at most 1.5 pp and the completion
reward by 0.3 pp.

Seat win rates by rotation, averaged over the other options:

| Players | No rotation | Clockwise | Counter-clockwise |
| --- | --- | --- | --- |
| 4 | 23.6 / 25.5 / 24.0 / 26.8% | 22.5 / 26.4 / 28.5 / 22.5% | 27.7 / 21.9 / 22.5 / 27.8% |
| 3 | 29.7 / 34.1 / 36.2% | 31.6 / 34.9 / 33.5% | 34.0 / 32.3 / 33.7% |
| 2 | 48.9 / 51.1% | 51.0 / 49.0% | 51.0 / 49.0% |

Most and least even scenarios:

| Players | Most even | Least even |
| --- | --- | --- |
| 4 | none · +0 · CC 0/1/3/6/10 · by stars: 1.4 pp (25.0 / 24.2 / 25.2 / 25.6%) | clockwise · +2 · CC 0/1/3/6/10 · by stars: 20.1 pp (19.8 / 16.1 / 36.2 / 27.9%) |
| 3 | counter-clockwise · +0 · CC 0/0/2/4/6 · by stars: 0.6 pp | clockwise · +2 · Count 0/0/2/4/6 · by stars: 13.4 pp |
| 2 | none · +1 · CC 0/1/3/6/10 · by stars: 0.2 pp | none · +2 · CC 0/0/3/6/9 · by stars: 12.6 pp |

At 4 players, rotation makes games less even, not more. Extra rounds also
widen the spread at 3 and 4 players.

## Star tree

Abilities grown per game (10 hearts at most) and games reaching tier 5:

| Preset | 2 players | 3 players | 4 players |
| --- | --- | --- | --- |
| Count 0/0/2/4/6 | 5.23, 25% | 7.29, 67% | 7.52, 73% |
| CC 0/0/2/4/6 | 5.76, 48% | 7.58, 79% | 7.68, 81% |
| CC 0/0/3/6/9 | 4.81, 15% | 7.01, 58% | 7.35, 69% |
| CC 0/1/3/6/10 | 4.03, 6% | 6.41, 46% | 6.97, 61% |

## Projects by difficulty

Per game, all players together, averaged over the 72 scenarios:

| Players | 1★ played / completed | 2★ played / completed | 3★ and 4★ played |
| --- | --- | --- | --- |
| 2 | 4.57 / 3.24 | 4.36 / 1.91 | 0 |
| 3 | 6.38 / 4.92 | 6.09 / 3.25 | 0 |
| 4 | 7.44 / 5.92 | 7.18 / 4.07 | 0.019 |

## Limits

- Bot-only evidence. Advance in every seat says how these rules play under
  this one strategy, not how people play. Seat effects from human habits are
  not covered.
- Advance keeps Novice's `advancedDraw = −0.5`, so it almost never draws
  advanced projects; 3★ and 4★ results say nothing about their balance.
- Spread grows with noise as well as with real imbalance; compare it with the
  chance level above before reading small differences.
