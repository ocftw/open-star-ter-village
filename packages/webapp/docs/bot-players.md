# Bot players — Standard mode

Bots play complete 星源樹測試版 v1 games headless, so a rule change can be tested
over hundreds of seeded games in seconds instead of 60–90 minute human sessions.
Three strategies ship: **Novice**, the reference that plays every seat in batch
runs; **Normal**, which plans from the rounds left and the tree's effect on
pace; and **Advance**, a Novice variant tuned to beat Novice when it acts
early.

How to test with bots, from a 5-second smoke run to a full sweep, and what
to commit: [bot testing](bot-testing.md).

## Run a batch

From the repository root:

```sh
pnpm webapp bots                                # 100 games each at 2, 3 and 4 players
pnpm webapp bots --players 4 --games 20 --seed trial
pnpm webapp bots --profile advance              # every seat plays Advance
pnpm webapp bots --weights '{"advancedDraw":1}' # override profile weights as JSON
pnpm webapp bots --no-move-log --out /tmp/run   # skip move logs, choose the output folder
pnpm webapp bots --players 4 --games 10 --rotation counterclockwise --extra-rounds 2 --tree-preset cc-013610 --rewards difficulty
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
game fails. Room options use the same strict normalizer as the server. Every
room option is played to the end by `pnpm webapp bots:smoke`
([bot testing](bot-testing.md)), one game per seed.

## How it works

Bot logic lives in `src/game/bots/`; the game-room parts (seat endpoints and
the bot runner) are `src/botSeats.ts` and `src/botRunner.ts`.

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

### Novice scoring

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
  The draw choice uses `advancedDraw` (negative in Novice, so it prefers the
  entry pile).

The `nodeImpact` values are initial guesses. Recalibrate them from batch data
(points per AP, node growth rate, ability trigger counts) and rerun.

### Advance

Every round is played in the same seat order (seat 1 first), because the start
player did not rotate yet (a bug since fixed, see the historical
[rule-option report](https://github.com/ocftw/open-star-ter-village/blob/c75742d9/packages/webapp/docs/evidence/standard-experiments/balance-300/README.md)). With
Novice in every seat, later seats finish the projects earlier seats set up
and win far more often. Advance is the `ADVANCE` profile: Novice's scoring
with four weights changed.

| Weight | Novice | Advance | Effect |
| --- | ---: | ---: | --- |
| `village` | 0.3 | 0 | No value for what tree abilities give other players (a village completion still counts half) |
| `unlock` | 0.5 | 0 | No value for higher tree tiers a growth makes reachable |
| `tree` | 1 | 0.6 | Tree nodes are worth less, so actions go to projects |
| `initiation` | 0 | −1 | Opening a project costs 1 point, so actions go to completing projects |

In paired trials it uses the actions it saves on the tree to complete its own
projects (its own 2★ completion rate roughly doubles) and to be the finisher
more often. Ablations show that the tree weights and the opening cost each
fail alone. In rooms a bot never takes seat 1, which is the host's, so the
evidence also covers seats 3 and 4. See
[the Advance evidence](evidence/bots/advance/README.md).

### Normal

Normal is the `NORMAL` profile (一般型, strategy id `normal`, seat names 阿明,
小華, 中中, 平平, 阿正, 小安): Advance's weights with `tree` back at 1 and a
`planner` block. Earlier runs called it Strategist (seat letter `S`; the
analyzer reads it as `M`). The planner replaces three guesses with estimates
from the current rules and the rounds left:

- **Finishing a project.** Instead of a completion chance that grows as
  positions fill, it counts the AP the bot still needs (one recruit per open
  job it has no cube on, then contributions at its cap), subtracts what the
  project's other contributors fill with `helperShare` of their AP, and
  compares that with `focus` of the bot's own remaining AP. The chance is
  about half when the two match and near 0.95 with a few AP to spare.
- **Drawing a project.** Each pile is worth the average, over the cards the bot
  has not seen, of starting the card next round and working it alone: points
  if it completes, half the contributions if not, the start reward, minus
  `apValue` for every AP it ties up. In the last round it keeps the entry pile.
- **Growing the tree.** An ability's AP per round is priced at `apValue`
  instead of 1, and the bot adds what the ability changes in its own live
  projects and hand cards, e.g. a 3★ that becomes finishable.

Caps, recruit value, start cost and AP per round come from the rules in play,
so grown abilities and events count. The planner does not yet predict whether
other players will join a new project or weigh its score against theirs.

### Compare profiles

Play every seat assignment of two profiles on the same seeds with the sweep's
`--tables` option, then summarize win rates by seat and by seat assignment:

```sh
cd packages/webapp
NODE_ENV=production pnpm exec tsx scripts/sweep-standard-scenarios.ts \
  --tables novice-normal --scenarios 0-7 --batches 5 --runs 100 --out bot-runs/novice-normal
python3 scripts/summarize-seat-tables.py bot-runs/novice-normal
```

`--tables all` seats Novice and Advance, `novice-normal` Novice and Normal,
`normal-seat` Normal in each seat against Advance. See
[bot testing](bot-testing.md) for how to size and record a run.

## Bots in game rooms

In a Standard room, the host can seat bots before starting:

1. In the waiting room, each empty seat shows **＋ 電腦 · Add bot** to the host.
   With more than one strategy registered, a picker appears next to it.
2. A bot seat shows its name, `BOT`, and its strategy, e.g. `🤖 新手型 Novice`.
   The host can free it with **✕** until the game starts. Other players see
   bots but no controls.
3. Bot seats count as filled, so the host can start once every seat is a
   human or a bot. In game, bot names carry a 🤖 marker.

Rules:

- Bots play Standard rooms only, and only the host (seat 0) can add or remove
  them, before the game starts.
- Bots use the same player view as humans: no decks, no other hands.
- Bot seats do not keep a room alive:
  - Bots pause while no human in the room is connected, and resume when one
    reconnects.
  - The lobby hides such a room from everyone except a browser that still
    holds a seat in it, so a solo player can use 回到桌子 to return.
  - Once no human is seated (for example the host leaves a room of bots), the
    server deletes the room.
- If a human leaves mid-game the match ends as before, and its bots stop.
- Bot seats are recognised on the server by a server-generated credential
  (`bot:` prefix), not by seat data a player could set.
- Matches live in server memory, so a server restart ends bot games too.
- Play again (再來一局) starts a fresh room without the bots; the host adds
  them again.

How it works on the server:

- `POST /games/OpenStarTerVillage/:matchID/bots` with
  `{ playerID: "0", credentials, seat, strategy }` seats a bot.
  `POST /games/OpenStarTerVillage/:matchID/bots/:seat/remove` with
  `{ playerID: "0", credentials }` frees it (`src/botSeats.ts`).
- The bot seat's metadata gets a name from the strategy's name list, `data:
  { bot: { strategy } }`, and a random credential. The lobby API strips
  credentials, so it never leaves the server.
- `src/botRunner.ts` polls matches every 2 s. For each bot seat of a started,
  unfinished match, it connects a multiplayer client with that credential and
  plays the seat. It waits `BOT_MOVE_DELAY_MS` (default 800) before each move
  so humans can follow, and disconnects when the game ends, the match is
  terminated or deleted, the seat stops being a bot, or no human in the room
  has a live socket (bots resume when one reconnects). It deletes a room once
  only bots are seated in it.

### Adding a strategy

1. Add a weight profile in `src/game/bots/profiles.ts` and to `PROFILES`.
2. Register it in `BOT_STRATEGIES` (`src/game/bots/strategies.ts`) under the
   same key, with an `id`, a `label`, a short `description` and a list of seat
   names: at least three, so a full room never repeats one, and none used by
   another strategy.

The waiting room then offers it in the strategy picker, and the CLI accepts it
with `--profile <id>`.

## Telemetry

`G.standard.telemetry` records balance data on the server: per project its
difficulty, initiator, finisher and contribution snapshot; the first round each
player passes 20 influence; advanced draws; queued, resolved, skipped and
target-less counts per choice kind (each Government 5 point is its own choice,
so queued = resolved + skipped + target-less); and Government 5 budget versus
points used.

`playerView` always removes it, so players and spectators never receive it and
the player export is unchanged. Only the bot runner and debug mode can read it.
Matches created before telemetry existed simply have none.

### Human debug mode

For human playtests on a **test deployment only**:

1. Start the game server with `DEBUG_TELEMETRY=1`. It logs a warning and adds
   `GET /debug/matches/:matchID/telemetry`. Without the flag the route does not
   exist (404). Never set it on the live game server.
2. Open the game page with `?debug=1`, e.g. `/game/<matchID>?debug=1`. A debug
   panel under the tree shows the telemetry (projects with initiator, finisher
   and contribution snapshot; Government 5 budget; advanced draws; choice
   counts) and an export button that includes it.

Without the server flag, `?debug=1` shows nothing. On the isolated tree-poc
Fly app: `flyctl secrets set --app open-star-ter-village-tree-poc DEBUG_TELEMETRY=1`.

## CI

`src/game/bots/*.test.ts` checks that every enumerated action is accepted across
seeded games, that 2/3/4 Novice and random bots finish in 9 − n rounds, that a
seed replays identically, and that rejected moves and stuck games fail loudly.
`advance.test.ts` plays Advance from seats 1 and 2 to game over at every player
count and rule option and replays it from a seed; `strategies.test.ts` checks
every registry entry.
`src/game/standard/telemetry.test.ts` checks the telemetry never reaches a
player view.

## Limits

Bots measure reachability, pacing and degenerate strategies. They do not measure
clarity, fun or UI problems. With one strategy in every seat, results describe
how Novice plays, not how humans or other strategies would. Advance is tuned
against Novice only; its win rates say nothing about how it fares against
humans. Advanced
projects in particular need a strategy that wants them (milestone 2).

## Tree v2 valuations

Sweep with `--tree-rules v1`, `v2-collab`, `v2-maintenance`, a comma-separated
selection, or `all` (see [bot testing](bot-testing.md)). The default is v1.
V1 node impacts, action scores and tie breaking stay unchanged.

Both v2 variants use the shared connection helpers: any grown node one tier
below connects all three next-tier nodes. Unlock value counts only nodes not
already connected. Separate v2 `nodeImpact` tables keep experimental tuning
out of the v1 profiles.

- **開源 3 — 主力職能發起:** initiation and Normal's pace model use the card's
  largest required job, including ties; wildcard initiation uses its assigned
  job. V1 retains its engineer-specific estimate.
- **開源 4 — 經驗傳承:** the expanded impact estimate covers any job. Choice
  scoring evaluates the actual target player's cube, the bot's own expected
  contribution and owner points, and the advanced cube owner's finisher
  credit. Helping somebody else is not credited to the bot as its own cube.
- **政府 1 — 開放標案:** Normal compares unseen entry and advanced cards when
  growth (including its reward) newly puts the bot above the lower gate.
  It values only a positive improvement over entry; Advance retains its flat
  `advancedDraw` preference. Access is strictly above 10, not at 10.
- **政府 2 — 協作合約:** the project model adds +2 for a non-owner with at least
  one cube on a 3★/4★ project, weighted by completion probability. Multiple
  cubes do not multiply the contract.
- **政府 2 — 維運合約:** the project model adds owner value of +1 times remaining
  round ends, weighted by completion probability. The current round is
  included. This is a planning estimate assuming completion this round; it
  can overvalue slow projects. Completed projects are absent from this
  estimate, so existing contracts are not retroactively awarded on growth.

Contract estimates require Government 2 already grown (or its hypothetical
growth when Normal evaluates that node). Entry projects receive neither
contract. These are initial heuristics, not measured balance claims. Before
the engine PR merges, rely on valuation unit tests rather than v2 game scores.
