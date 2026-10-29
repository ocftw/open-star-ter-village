# Bot testing

How to test the bots and the Standard rules with bot games, from a quick check
to a full sweep, and how to keep the results.

Bot games are deterministic. The seed fixes the deals, the events and each
seat's tie-break stream, so the same seed, bots, rules and options always give
the same game, move for move.

## Seeded testing rules

A *combination* is one room-option scenario, one rule set, one bot seating
(which profile sits in which seat) and one seed. Its game is fixed.

1. **One game per combination.** Play each combination once. Playing it again
   gives the same game and adds no information.
2. **Scale by adding combinations, never by repeating one.** For more games,
   add seeds (`--batches`, `--runs`); for more rules or room options, add
   scenarios (`--scenarios`); for more bots, add seatings (`--tables`). Every
   new seed is a new deal and event order: a sweep's seed is
   `<prefix>-b<batch>-<players>p-r<run>`, so 30 batches × 100 runs is 3,000
   different deals per scenario and player count.
3. **Pair on seeds.** Use the same seeds for every scenario and seating you
   compare, so a difference comes from the option or the bot, not the deal.
   The sweep shares each seed across all scenarios and seatings in a run.
4. **Replay only to check.** Rerun recorded seeds only to confirm nothing
   changed (`bots:behaviour`, the replay tests). The numbers must match
   exactly; any difference means the rules or a bot changed behaviour.
5. **Keep one recorded result per question.** A recorded run stays valid while
   it replays exactly at the current build. When behaviour changes, record a
   new run and remove the old one instead of keeping both; git history keeps
   it.

All commands run from the repository root. Sweep output goes to
`packages/webapp/bot-runs/` (gitignored).

## Levels

| Level | Command | Games | Time (Apple M4, 10 cores) | Answers |
| --- | --- | --- | --- | --- |
| Unit | `pnpm webapp test src/game/bots` | about 100 | 15 s | Do the bots, runner and rules hooks work? |
| Smoke | `pnpm webapp bots:smoke` | 432 | 5 s | Does every room option play to the end at 2, 3 and 4 players without a failed game, and does the analysis pipeline run? |
| Behaviour | `pnpm webapp bots:behaviour` | 9,000 | 75 s | Do the bots still play exactly as recorded? |
| Full sweep | see below | 648,000 | 71 min | How do room options and bots affect balance? |

### Unit

Jest covers what each piece must do: legal moves only, replay from a seed,
every opening event, every rotation × extra-round setting, profile weights,
strategy registry and batch summaries. Each full-game test plays one or a few
games. Matrices of every option belong in the smoke run, not in Jest.

### Smoke: does it work

`bots:smoke` plays one batch of 2 runs under all 72 room-option scenarios at
2, 3 and 4 players with Advance in every seat, then runs the analyzer. The
sweep exits non-zero if any game fails; the analyzer fails if any scenario has
no games. Run it after any change to rules, room options, bots or the sweep
scripts.

### Behaviour: did it change

`bots:behaviour` replays the default room (no rotation, no extra rounds,
Count 0/0/2/4/6, fixed rewards) for the same 30 × 100 seeds as the recorded
[all-Advance sweep](evidence/bots/advance/sweep72/README.md), then
`scripts/check-bot-baseline.py` compares seat win rates, scores, ties, rounds,
moves, tree growth, projects and score sources with the recorded analysis.
They must match exactly.

- **Match:** behaviour is unchanged.
- **Difference you did not intend:** a bug. The output names each field that
  moved.
- **Difference you intended** (a rule or bot change): the recorded evidence
  is now out of date. Run a full sweep on the new build and record it as a new
  run (below), then point `bots:behaviour` at the new run's `analysis.json`.

## Full sweep and persisting results

Run long sweeps in production mode; it skips boardgame.io's dev checks and is
about twice as fast with identical results.

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables advance --batches 30 --runs 100 --out bot-runs/<run>
python3 scripts/analyze-standard-sweep.py bot-runs/<run>
python3 scripts/report-standard-sweep.py bot-runs/<run>
```

- `--tables` picks the seatings: `advance` or `normal` (one profile in every
  seat), `all` (every Novice/Advance seat assignment, 2ⁿ tables per player
  count), `novice-normal` (every Novice/Normal assignment) or `normal-seat`
  (Normal in each seat, Advance in the others).
- `--scenarios default`, `--scenarios 0,5,17` or `--scenarios 0-7` plays only
  those scenarios.
  Job files keep their index in the full 72, so they pair with a full sweep.
- The sweep resumes: rerun the same command and finished jobs are skipped.
  Delete the output folder to start over.
- The analyzer uses only batches finished for every scenario in the run, so
  scenarios stay paired.

### Choosing a size

Each batch replays the same deals in every scenario, so independent games per
scenario equal batches × runs. A seat's win rate has a standard error of about
√(p(1−p)/games): at 4 players, 3,000 games give about 0.8 percentage points.
Use 30 × 100 for balance claims, and more batches before trusting a difference
under about 2 points.

### What to commit

Record a run under `docs/evidence/bots/<profile id>/<run>/`, following
[the evidence index](evidence/bots/README.md):

- `README.md`: date, build, machine, the exact commands, results tables and
  limits.
- `manifest.json` (build, seeds, scenarios, bot weights) and `analysis.json`
  (a sweep) or `summary.json` (a run that mixes profiles).
- Do not commit per-game records (`bot-runs/**/*.jsonl.gz`). They are large,
  and the manifest's build and seeds regenerate them exactly.

The sweep refuses nothing on a dirty tree, but the manifest records
`uncommittedSrcChanges`. Commit before a run you intend to record.

Other tools:

- `pnpm webapp bots` for a quick batch with per-game exports and move logs
  ([bot players](bot-players.md)).
- `scripts/summarize-seat-tables.py bot-runs/<run>` for win rates by seat and
  seat assignment in a run that mixes profiles.
