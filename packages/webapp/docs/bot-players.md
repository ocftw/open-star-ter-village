# Bot players — Standard mode

Bots play complete 星源樹測試版 v1 games headless, so a rule change can be tested
over hundreds of seeded games in seconds instead of 60–90 minute human sessions.
Milestone 1 ships one strategy, **Balanced**, playing every seat.

## Run a batch

From the repository root:

```sh
pnpm webapp bots                                # 100 games each at 2, 3 and 4 players
pnpm webapp bots --players 4 --games 20 --seed trial
pnpm webapp bots --weights '{"advancedDraw":1}' # override profile weights as JSON
pnpm webapp bots --no-move-log --out /tmp/run   # skip move logs, choose the output folder
```

Output goes to `packages/webapp/bot-runs/<timestamp>/` (gitignored):

| File | Contents |
| --- | --- |
| `games/<seed>.json` | Same fields as the player export, plus `seed`, `profile` and `telemetry` |
| `moves/<seed>.jsonl` | Every move: step, round, player, move name and arguments |
| `summary.json` | Per player count: score distribution, seat win rate, tier 3/4/5 reach, hearts, outcomes, completions by difficulty, advanced draws/completions, first round over 20 influence, Government 5 budget use, choice counts, node growth rate, nodes never grown, choices never queued |
| `summary.csv` | One row per player count with the headline numbers |
| `failures.json` | Only when a game failed: seed and the rejected move or step limit |

The same seed always replays the same game, so a failing or surprising seed
can be rerun and inspected move by move. The command exits non-zero if any
game fails.

## How it works

All code lives in `src/game/bots/`.

- `enumerate.ts` lists every legal move for one player from **that player's view
  only** (own hand and the public board; no decks or other hands). Each candidate
  passes the same validators as the UI preflight. Contributions use a curated set
  (+1, fill one position, spread the budget) rather than every combination.
  Optional choices always include skip.
- `runner.ts` plays a game with the authoritative boardgame.io reducer. It hands
  each bot its `playerView`, and fails immediately with the seed, step and move if
  the game rejects a move or the game exceeds the step limit.
- `profileBot.ts` scores each legal move with `evaluate.ts` and plays the best,
  breaking ties with a per-game, per-seat seeded RNG. Ending the turn scores 0.
- `profiles.ts` holds the weight profiles. A new strategy is mostly a new profile.

### Balanced scoring

- **Projects:** change in the bot's expected points. A project completes with a
  chance that grows from `baseCompletionChance` to 1 as positions fill, discounted
  in the last two rounds. Completing it settles every contribution, the owner and
  finisher bonuses, returns worker tokens, and adds village progress toward tree
  tiers. Unfinished contributions are worth half at game end.
- **Tree nodes:** `REWARDS[tier] + consequence + unlock`.
  - `consequence` = the ability's estimated AP gain per round (`nodeImpact`)
    × rounds left × players who benefit (self plus `village` × others) ×
    `pointsPerAP`.
  - `unlock` = the reward of tier-above nodes the growth makes reachable,
    halved until the village completion threshold for that tier is met.
- **Costs:** `apCost` per AP (at least the leftover-AP score in the last round),
  `overtime` for using the overtime token, `workerToken` per token spent.
- **Choices:** each target is scored with the same project model; skip is 0.
  The draw choice uses `advancedDraw` (negative in Balanced, so it prefers the
  entry pile).

The `nodeImpact` values are initial guesses. Recalibrate them from batch data
(points per AP, node growth rate, ability trigger counts) and rerun.

## Telemetry

`G.standard.telemetry` records balance data on the server: per project its
difficulty, initiator, finisher and contribution snapshot; the first round each
player passes 20 influence; advanced draws; queued, resolved, skipped and
target-less counts per choice kind; and Government 5 budget versus points used
(each resolved point counts once).

`playerView` always removes it, so players and spectators never receive it and
the player export is unchanged. Only the bot runner and debug mode can read it.
Matches created before telemetry existed simply have none.

## CI

`src/game/bots/*.test.ts` checks that every enumerated action is accepted across
seeded games, that 2/3/4 Balanced and random bots finish in 9 − n rounds, that a
seed replays identically, and that rejected moves and stuck games fail loudly.
`src/game/standard/telemetry.test.ts` checks the telemetry never reaches a
player view.

## Limits

Bots measure reachability, pacing and degenerate strategies. They do not measure
clarity, fun or UI problems. With one strategy in every seat, results describe
how Balanced plays, not how humans or other strategies would. Advanced
projects in particular need a strategy that wants them (milestone 2).
