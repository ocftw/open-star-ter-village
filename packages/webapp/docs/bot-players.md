# Bot players — Standard mode

Bots play complete 星源樹測試版 v1 games headless, so a rule change can be tested
over hundreds of seeded games in seconds instead of 60–90 minute human sessions.
Two strategies ship: **Balanced**, the reference that plays every seat in batch
runs, and **Counter**, a Balanced variant tuned to beat Balanced when it acts
early.

## Run a batch

From the repository root:

```sh
pnpm webapp bots                                # 100 games each at 2, 3 and 4 players
pnpm webapp bots --players 4 --games 20 --seed trial
pnpm webapp bots --profile counter              # every seat plays Counter
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

### Counter

Every round is played in the same seat order (seat 1 first), because the start
player does not rotate yet (a known bug, see the
[rule-option report](evidence/standard-experiments/balance-300/README.md)). With
Balanced in every seat, later seats finish the projects earlier seats set up
and win far more often. Counter is the `COUNTER` profile: Balanced's scoring
with four weights changed.

| Weight | Balanced | Counter | Effect |
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
[the Counter evidence](evidence/bot-strategies/counter-1000/README.md).

### Compare a profile with Balanced

```sh
cd packages/webapp
pnpm exec tsx scripts/compare-bot-strategies.ts --challenger counter --games 300 --out /tmp/counter
python3 scripts/analyze-bot-strategies.py /tmp/counter
```

Each seed is played all-Balanced and again with the challenger in seat 1, then
seat 2 (`--seats`), at 2/3/4 players across the four Standard rule options
(`--scenarios`), using every CPU (`--jobs`). `--weights` overrides the
challenger's weights for ablations. The analysis reports the challenger's win
share (ties split) with a 95% interval, the paired change against Balanced in
the same seat and seed, and which score sources moved.

## Bots in game rooms

In a Standard room, the host can seat bots before starting:

1. In the waiting room, each empty seat shows **＋ 電腦 · Add bot** to the host.
   With more than one strategy registered, a picker appears next to it.
2. A bot seat shows its name, `BOT`, and its strategy, e.g. `🤖 平衡型 Balanced`.
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
seeded games, that 2/3/4 Balanced and random bots finish in 9 − n rounds, that a
seed replays identically, and that rejected moves and stuck games fail loudly.
`counter.test.ts` plays Counter from seats 1 and 2 to game over at every player
count and rule option and replays it from a seed; `strategies.test.ts` checks
every registry entry.
`src/game/standard/telemetry.test.ts` checks the telemetry never reaches a
player view.

## Limits

Bots measure reachability, pacing and degenerate strategies. They do not measure
clarity, fun or UI problems. With one strategy in every seat, results describe
how Balanced plays, not how humans or other strategies would. Counter is tuned
against Balanced only; its win rates say nothing about how it fares against
humans. Advanced
projects in particular need a strategy that wants them (milestone 2).
