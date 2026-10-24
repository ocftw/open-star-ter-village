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

Standard uses the 0/0/3/6/9 village-wide completion thresholds and the supplied
alternating diagonal connections. Each node costs 1 AP; ten hearts, two per
tier. Project types are ignored and hidden; difficulty and talent requirements
remain. All fifteen abilities are implemented. Entry cards are difficulty 1–2;
advanced cards are difficulty 3–4 and are drawable only above 20 influence.
The seven existing events plus revised 數位政委 form the test event pool.
Draw 6/5/4 ordinary events for 2/3/4 players, then the final event.

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
  one point at a time to their existing cubes elsewhere. Earned score is retained.
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
of tiers 3–5, growth choices and ability clarity before considering 2/4/6 thresholds.
