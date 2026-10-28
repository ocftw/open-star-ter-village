# Standard Mode — 星源樹測試版 v1

## Switch and room contract

`src/game/standard/config.ts` contains the single release switch:

```ts
export const STANDARD_RULES_ENABLED = true;
```

Change it to `false` and redeploy to hide Standard room creation and reject it
on the server, including rematches. Existing state retains its ruleset; moves
never read the release switch. The in-memory server loses matches on restart.
Simplified remains the default (3–6 players). Standard allows 2, 3 or 4 players.

Standard defaults to the 0/0/2/4/6 village-wide completion thresholds and the supplied
alternating diagonal connections. Each node costs 1 AP; ten hearts, two per
tier. Project types are ignored and hidden; difficulty and talent requirements
remain. All fifteen abilities are implemented. Entry cards are difficulty 1–2;
advanced cards are difficulty 3–4 and are drawable only above 20 influence.
Standard uses all 14 printed events (13 ordinary plus the final event), including the revised 數位政委. Simplified retains its existing event pool.
Draw 6/5/4 ordinary events for 2/3/4 players, plus the selected 0/1/2 extra
ordinary events, then exactly one final event. Total rounds: `9 - players + extraRounds`.
See the [implemented event catalog](poc-event-cards.json) for all card wording and function IDs.

Room options are immutable after creation: starter rotation none (default),
clockwise or counterclockwise; extra rounds 0 (default), 1 or 2; and tree presets
count 0/0/2/4/6 (default), CC 0/0/2/4/6, CC 0/0/3/6/9 or CC 0/1/3/6/10.
CC is the village-wide sum of printed difficulty on uniquely completed projects.
Rotation changes the first seat each round, while within-round direction stays unchanged.

## Explicit test interpretations

- Data 1 raises the hand cap; cards are drawn during normal restoration.
- Data 3 immediately grants every player their fourth action token once.
- Data 5 allows a mismatched initiating labor card to fill a chosen required job.
- Government 4: after initiation, optionally consume another market labor card
  and one contribution token to recruit into a different project. No AP cost;
  regular recruit remains available. Data 2 and normal recruit restrictions apply.
- 數位政委: each project's initiator chooses one existing cube belonging to any
  player to advance one space, or skips. Resolve all choices before settlement.
  The cube owner receives finisher credit if it completes the project.
- Source 4: the finisher may advance their existing engineer cube elsewhere.
- Government 5: floor half the initiator's contribution; distribute this bonus
  to their cubes elsewhere, including new cubes costing one reserve token each.
  No card or AP cost. Earned score is retained.
- Resolve Source 4 then Government 5 in board order. Never exceed requirements;
  newly completed projects settle once through the same queue. Ordinary actions
  settle at turn end. Events settle before the first action.
- Empty project piles fall back only to another eligible pile. Government 1
  returns discarded cards to the bottom of the matching difficulty pile.
- Choice IDs prevent duplicate submissions. Only the designated player can
  resolve a choice. Refresh/reconnect retains the pending choice.

## Local verification

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm webapp test --runInBand
pnpm webapp exec tsc --noEmit
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3131 pnpm webapp build
PLAYWRIGHT_WEB_PORT=3130 PLAYWRIGHT_GAME_SERVER_PORT=3131 \
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
  pnpm webapp exec playwright test --config playwright.standard.config.ts --reporter=line
```

Install Chromium with `pnpm webapp exec playwright install chromium` using the
same browser-path setting if needed. Run the build and browser tests sequentially:
both use the same Next.js output directory. If native file watchers hang on
macOS, prefix the build command with `WATCHPACK_POLLING=true`. The Standard
Playwright configuration uses the built app and game server, without dev watchers.

## Isolated Fly deployment

Requires a logged-in Fly CLI and an organization allowed to create an app.
The app name below is a requested name, not proof that an app exists. If it is
unavailable, update all corresponding names/URLs in the test config together.

```sh
flyctl apps create open-star-ter-village-tree-poc
flyctl ips allocate-v4 --shared --app open-star-ter-village-tree-poc
flyctl ips allocate-v6 --app open-star-ter-village-tree-poc
flyctl secrets set --app open-star-ter-village-tree-poc \
  GAME_SERVER_ORIGINS=https://open-star-ter-village-tree-poc.fly.dev
flyctl deploy --config fly.tree-poc.toml --ha=false \
  --build-arg NEXT_PUBLIC_BUILD_SHA="$(git rev-parse HEAD)"
flyctl scale count 1 --app open-star-ter-village-tree-poc
```

Run the same suite against the deployed app (from outside Fly):

```sh
PLAYWRIGHT_BASE_URL=https://open-star-ter-village-tree-poc.fly.dev \
PLAYWRIGHT_GAME_SERVER_URL=https://open-star-ter-village-tree-poc.fly.dev:3001 \
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
  pnpm webapp exec playwright test --config playwright.standard.config.ts --reporter=line
```

The network clients require WebSocket transport; these checks cannot pass using
HTTP polling alone. They create disposable test rooms.

This test configuration has no production analytics and uses one always-on
Singapore machine. Verify `/`, `/lobby`, `:3001/health` and the lobby REST endpoint,
then follow the repository deploy-smoke-test skill. Never deploy during tests.
A restart loses matches. Retain the previously tested image for rollback.

## Human tests

Reserve 60–90 minutes each for two-player and four-player sessions on the same
frozen release. Export the public JSON summary at the end. It includes version,
build, duration, event/choice log, completions, tree growth rounds, scores and
remaining hearts; it excludes credentials and private hands. Compare reachability
of tiers 3–5, growth choices and ability clarity with the revised 2/4/6 thresholds.

## Full Standard event rules

Source: `game-content/event-cards.md`. Six Standard-only cards are added:
又老又窮啊 blocks growth; GitHub 當機了 blocks initiator contributions;
猛漢肺炎來襲 moves each existing cube back one (floor 1, owner marker unchanged);
鯊魚咬斷海底電纜 checks the current board and blocks initiation at two or more projects;
減薪休假啊 blocks ordinary and growth overtime; 抱歉了我的肝 queues an optional
second recruitment after the player's first ordinary recruit that round. It costs
one labor card and worker token, no AP or overtime, applies Data 2, and does not
recursively grant another recruitment. Government 4 is an ability choice, not an
ordinary recruit action, so does not trigger it. Choice state survives reconnect;
no eligible targets automatically skips. Event restrictions expire with the event
and do not remove permanent tree upgrades. Event draw counts remain 6/5/4 plus final.

Balance audit: [findings and data limits](balance-audit.md).

## Per-room rule experiments

New Standard rooms fix Government 5 to new-own-cube mode. The server rejects
the retired existing-only option. Old serialized states retain their original
behavior; historical A/B/C/D scripts explicitly opt into offline compatibility.
The completion-reward selector remains available. Simplified rejects these options.

| Setting | Default | Experiment |
| --- | --- | --- |
| Government 5 (fixed) | Allocate to any unfilled required profession on another project. Creating the initiator's own cube costs **one reserve worker token**, no labor card or AP. | No selector. Advancing an existing cube costs no further token; no reserve means no new cube. |
| Initiator / finisher rewards | +2 / +2 | Each gets the project's printed difficulty, +1 to +4. The annual-accounting event's initiator +2 remains additive. |

Government 5 still grants `floor(initiator contribution / 2)` points without
reducing the original score. It cannot advance another player's cube, exceed
requirements or spend twice on a duplicate request. Chained completions return
new cubes to inventory normally. Players may allocate some points and skip the
rest. Rotation, extra rounds and tree presets yield 36 configurations per player
count; both reward modes double that. Historical A/B/C/D evidence describes its
original build, not the new scoring and rotation implementation.

The lobby, waiting room and tree panel show the settings. Reconnect restores
pending decisions. Play Again forwards the same settings; the public JSON
export and bot exports include `experiments`, `standardOptions`, public CC progress
and public history. History includes ordinary actions, score reasons, event
effects and removed-project snapshots, but no hidden hands or discarded hand-card IDs.
Final unfinished-project VP is floored separately for each player's contribution
on each project, then summed. Bots use the selected rewards and
new-cube token cost in their action evaluation.

[Runtime scenarios, screenshots and deployment record](evidence/standard-experiments/README.md).
