# Open StarTer Village Web App

Open StarTer Village Web App is the online version of the Open StarTer Village
board game. It supports 3-6 players, approximately 60 minutes per session, and
Traditional Chinese / English content.

Rulebook: [Rulebook of Open StarTer Village](https://drive.google.com/file/d/1gBGKhavLdDQ-J1elxQNN6E7Sdz0ZBTeO/view?usp=drive_link)

## Runtime

- Next.js client: `http://localhost:3000`
- Game server: `http://localhost:3001`
- Node.js: `>=24`
- Package manager: repository pnpm `11.15.1`

## Commands

Run these from the repository root:

```bash
pnpm webapp dev        # Start the Next.js client and game server
pnpm webapp build      # Build Next.js and compile the game server
pnpm webapp start      # Start the built app and game server
pnpm webapp test       # Run Jest tests
pnpm webapp lint       # Run ESLint
```

Run all pnpm workspaces from the repository root:

```bash
pnpm all:dev
pnpm all:build
pnpm all:lint
```

The aggregate development command runs the homepage on port `3100` so it does
not conflict with the webapp on ports `3000` and `3001`.

Run a single Jest test file from this package:

```bash
pnpm webapp test --testPathPattern=game.test
```

## Deployment

The web app has two runtime processes:

1. **Next.js client** - the browser UI and Next.js app.
2. **Game server** - a long-running Node.js boardgame.io server with
   Socket.IO/WebSocket transport.

Do not deploy the game server as a serverless function that cannot hold
Socket.IO/WebSocket connections.

### Deploy to Fly.io

Fly.io is the alpha deployment target for online multiplayer because it can run
the Next.js client and long-lived boardgame.io SocketIO server in one Node
container close to Taiwan players.

Rejected alternatives:

- Vercel: good fit for the Next.js client, poor fit for the long-lived in-memory
  SocketIO game server.
- Render: workable, but the free/low-cost sleep behavior is a bad fit for live
  matches.
- Railway: workable, but Fly.io gives more explicit region and VM control for
  this alpha.

### Deploy Your Own Village

Prerequisites:

- A Fly.io account.
- The `flyctl` CLI.
- Node.js 24+ and the repository pnpm 11.15.1 for local verification.

Create an app from the repository root:

```bash
cp fly.toml.example fly.toml
# Edit fly.toml and replace your-village-app with your Fly app name.
fly launch --copy-config
```

The included `fly.toml` is the Open StarTer Village alpha deployment config and
is safe to publish because it contains app routing, region, and build-time
public URLs only. It does not contain Fly API tokens, CORS secrets, webhooks, or
private credentials. For your own deployment, start from `fly.toml.example` and
replace the app name and public URLs.

The game-server Fly configs use one Fly app and one container. The Next.js client listens
on port `3000`, and the boardgame.io server listens on port `3001`.

Required configuration:

- `NEXT_PUBLIC_GAME_SERVER_URL`: public URL for the game server. This is inlined
  by Next.js at build time, so set it as a Docker build argument before
  `next build`; changing a runtime env var later will not update the browser
  bundle.
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`: optional public GTM container ID. It is
  also inlined at build time. Production uses `GTM-N324PT4J`; omit it from local
  and preview builds so they do not send analytics data.
- `GAME_SERVER_ORIGINS`: comma-separated allowed browser origins for the game
  server CORS policy. Set this as a Fly secret.

Example:

```bash
fly secrets set GAME_SERVER_ORIGINS=https://open-star-ter-village.fly.dev
fly deploy --build-arg NEXT_PUBLIC_GAME_SERVER_URL=https://open-star-ter-village.fly.dev:3001
```

### Google Analytics

The homepage and webapp share one GTM container and GA4 web stream. GA4 Admin
must configure `openstartervillage.ocf.tw` and
`open-star-ter-village.fly.dev` for cross-domain measurement.

The webapp emits business events through `dataLayer`:

- `game_intent` when `/lobby` is reached.
- `project_catalog_interest` when the header or game-over catalog link is
  selected. Its `link_placement` is `header` or `game_over`.
- `link_click` for every anchor activation. It records a `link_id`, a
  privacy-safe destination without query parameters, placement, locale, and
  viewport bucket. Only links carrying `data-analytics-id` (or an `id`) get
  their own stable `link_id`; untagged ones fall back to `internal:untagged` or
  `external:<hostname>` so GA4 does not collapse the whole high-cardinality
  dimension into `(other)` and take the tagged ids with it. Add
  `data-analytics-id` and `data-analytics-placement` to any link worth reporting
  on its own; the full path of an untagged link is still in `link_url`. This
  supports link-popularity reports only (by `link_id` for tagged links, by
  `link_url` otherwise); it does not collect pointer coordinates or produce a
  visual heatmap.

The first two events are GA4 key events. GTM must publish GA4 event tags for them, while
the homepage promotion flow uses the recommended `view_promotion` and
`select_promotion` events.

For a custom domain, add the certificate in Fly and include that origin in
`GAME_SERVER_ORIGINS`:

```bash
fly certs add village.example.org
fly secrets set GAME_SERVER_ORIGINS=https://village.example.org
fly deploy --build-arg NEXT_PUBLIC_GAME_SERVER_URL=https://village.example.org:3001
```

The alpha runs on `shared-cpu-1x` with 256 MB memory and keeps one machine warm.
Expect roughly USD $2-5/month depending on region, transfer, and Fly pricing
changes.

The deployed alpha is memory-only. This persistence build can additionally save
member-hosted matches when configured below; guest-hosted matches remain in memory.

Run the [`webapp-deploy-smoke-test` agent skill](skills/webapp-deploy-smoke-test/SKILL.md)
after every deploy.

### Match persistence: OCF handover (#449)

These are maintainer operating notes for
[RFC 009](https://github.com/ocftw/open-star-ter-village/issues/445).
**Do not provision, deploy, restart production, or change Fly secrets during
the usability-test deployment freeze.** Secret changes can restart Machines.
The settings and health field below require this persistence build to be
running. They implement [#446](https://github.com/ocftw/open-star-ter-village/issues/446)
and [#447](https://github.com/ocftw/open-star-ter-village/issues/447).
Member-hosted matches will only be saved once member sign-in issues host tokens;
there is no interim persistence for guest-hosted matches.

The server runs games synchronously in boardgame.io's `InMemory` subclass;
PostgreSQL upserts run afterward in one queue per member-hosted match. The checked-in
pnpm patch only exports boardgame.io 0.50.2's existing `InMemory` class and its type;
it does not change move handling. Node.js 24 supports the ESM runtime dependencies,
and the server compiler uses NodeNext resolution. `pnpm webapp build` copies the
SQL migration scripts into the compiled server output.

On SIGTERM/SIGINT, the launcher forwards the signal to both children. The game
server stops intake and drains pending saves within 10 seconds. On timeout it
logs unsaved match IDs and exits with failure. Fly's 30-second `kill_timeout`
leaves time for forwarding, drain, and process cleanup. A hard crash can lose
recent moves that had not reached PostgreSQL; a database outage keeps gameplay
in memory and retries the newest pending state with backoff.

#### Configuration examples

Use the repository-root [`fly.toml.example`](../../fly.toml.example) for the game
app and [`fly.postgres.toml.example`](../../fly.postgres.toml.example) for a
separate self-run PostgreSQL 16 app. The database example uses `sin`, one
shared-cpu-1x Machine with 512 MB RAM (1 GB is an option), and a `postgres_data`
volume mounted at `/var/lib/postgresql/data`. Create the volume at **3 GB**;
the example does not create it. Keep one database Machine, on the same private
network as the game app, with no public IP allocation or proxy services. Leave
Fly's default automatic volume snapshots enabled. Extra backups, replication,
archiving, and restore procedures are outside this RFC.

The database needs a `POSTGRES_PASSWORD` Fly secret before its first boot.
The game app needs these **runtime** settings after the implementation ships:

| Setting | Value and effect |
| --- | --- |
| `DATABASE_URL` | Fly secret, e.g. `postgres://village:URL_ENCODED_PASSWORD@your-village-postgres.internal:5432/village`. Use the database app's private `.internal` hostname and percent-encode the password. |
| `MATCH_PERSISTENCE` | Fly secret: `member` enables member-hosted saves; `off` opens no database connection. Without `DATABASE_URL`, the default is `off`; with it, the default is `member`. |
| `GAME_SERVER_AUTH_SECRET` | Strong random Fly secret shared by Next.js and the game server for HS256 host tokens. Never use a `NEXT_PUBLIC_` name or a Docker build argument. |
| `MATCH_RESUME_WINDOW_HOURS` | Optional runtime setting, default `24`; controls both startup loading and abandoned-match marking. For a class spanning lessons, use e.g. `48`. |

Keep secret values out of the repository, command transcripts, logs, and Sentry.
An OCF maintainer can import `NAME=VALUE` entries through standard input with
`fly secrets import --app <game-app>` from a protected file outside the checkout.
Use a separate secret import for the database app's `POSTGRES_PASSWORD`.
These commands are for a maintenance window after the freeze, not this handover.

#### Maintainer provisioning and acceptance checklist

- [ ] After the freeze and implementation prerequisites, create the PostgreSQL
  app in the OCF Fly organization/private network, using official `postgres:16`,
  `sin`, shared-cpu-1x, 512 MB (or 1 GB), and one 3 GB volume. Keep automatic
  snapshots enabled, one Machine, no public IPs, and no public service ports.
- [ ] Set the database password before boot; set `DATABASE_URL`,
  `MATCH_PERSISTENCE=member`, and `GAME_SERVER_AUTH_SECRET` on the game app.
  Deploy the persistence build outside an active play session after the freeze.
- [ ] Check `fly ips list --app <database-app>` and the deployed database config:
  no public IPs, no `services` or `http_service`. From the game Machine, verify
  the private hostname resolves and connects on port 5432; inspect sanitized
  startup logs for migration/loading success. Do not publish the connection URL.
- [ ] Request `https://<game-app>.fly.dev:3001/health`; expect HTTP 200 and
  `persistence: "on"`. This proves initialization, not that a guest-hosted match
  is stored. `"off"` means memory-only; `"degraded"` means database startup failed
  and this run is memory-only. Recover the database and restart outside play
  sessions to retry initialization.
- [ ] Once member sign-in is available, run the deploy smoke test with a member
  host and two guests, recording reconnect and continued play after a restart.
- [ ] Record the actual monthly estimate and billing in #449: game Machine,
  database Machine, volume/snapshots, and transfer, converted to TWD. Confirm
  the total is at or under **NT$1,240/month**; do not treat this config as proof
  of cost. Recheck when resizing or pricing changes.

#### Rotate secrets and switch persistence off

During an approved maintenance window, rotate the database user's password
through a private PostgreSQL session (for example psql's interactive
`\password village`), then update the database app's `POSTGRES_PASSWORD` secret
and the game app's `DATABASE_URL`. Changing `POSTGRES_PASSWORD` alone only affects
initialization of an empty data directory; it does not change an existing role.
Rotate `GAME_SERVER_AUTH_SECRET` on both token issuer and verifier together;
existing host tokens then fail verification and create guest-hosted matches.
After either rotation, verify `/health` and a member-hosted create/save flow.

For budget shutdown, first finish active play sessions, then have a maintainer run:

```bash
fly secrets set MATCH_PERSISTENCE=off --app <game-app>
# Wait for the game Machine update; verify HTTP 200 and persistence: "off".
curl --fail https://<game-app>.fly.dev:3001/health
# Only after "off" is confirmed, stop the database Machine.
fly machine stop <database-machine-id> --app <database-app>
```

Confirm new guest create/join/play still works with the database stopped.
Restarting the game app discards memory-only matches; schedule changes outside
play sessions. A stopped database still incurs volume/snapshot charges. Keep
the volume if saved matches should remain; deletion and retention are outside
this handover. To resume persistence, start the database Machine, restore
`MATCH_PERSISTENCE=member` in another maintenance window, and verify `"on"`.
Matches older than the configured resume window will not load.

References: [Fly app configuration](https://fly.io/docs/reference/configuration/),
[private networking](https://fly.io/docs/networking/private-networking/),
[secret updates](https://fly.io/docs/apps/secrets/),
[official PostgreSQL image](https://hub.docker.com/_/postgres), and
[Fly pricing](https://fly.io/docs/about/pricing/).

### UptimeRobot Monitoring

Fork maintainers can mirror the alpha uptime checks with a free UptimeRobot
account. Use the free 5-minute monitoring interval and create three HTTP(s)
monitors:

1. **Frontend**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `<app> frontend`
   - URL to monitor: `https://<app>/`
   - Monitoring Interval: `5 minutes`
   - HTTP Method: `GET`
2. **Game server health**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `<app> game server health`
   - URL to monitor: `https://<app>:3001/health`
   - Monitoring Interval: `5 minutes`
   - HTTP Method: `GET`
3. **Game server lobby REST**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `<app> game server lobby REST`
   - URL to monitor: `https://<app>:3001/games/OpenStarTerVillage`
   - Monitoring Interval: `5 minutes`
   - HTTP Method: `GET`

To send alerts to Discord, use the same ops channel webhook that receives
deployment notifications. In UptimeRobot, add an alert contact using the
Discord webhook URL, then attach that contact to every monitor. Keep the webhook
URL private; do not commit it to this repository or store it in `fly.toml`.

### Sentry Error Monitoring

The web app can report runtime errors from both the Next.js process and the
boardgame.io game server. Sentry is optional: if `SENTRY_DSN` is not set, the
SDKs do not initialize.

For the Fly.io alpha, create the Fly Sentry extension:

```bash
flyctl ext sentry create --app open-star-ter-village
```

This creates a Sentry project and sets `SENTRY_DSN` as a Fly secret. To include
browser-side Sentry initialization in production bundles, also add the DSN as a
GitHub Actions secret named `SENTRY_DSN`. The DSN is intentionally inlined into
the browser bundle at build time so the Next.js client can report errors; Sentry
DSNs identify the project but are not authentication secrets.

For release tracking and source-map upload during GitHub Actions deploys, add
these GitHub Actions secrets:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

The deploy workflow uses the Webapp CI commit SHA as `SENTRY_RELEASE` and passes
it to both the Docker build and Fly runtime environment. Source-map upload is
enabled only when all four GitHub Actions secrets are present:
`SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`. Without
the full set, runtime error reporting still works when `SENTRY_DSN` is present,
but the build skips Sentry source-map upload.

Performance tracing is intentionally deferred for the Fly.io alpha. Do not set
`tracesSampleRate` or `tracesSampler` for the 256 MB shared CPU deployment
without re-running production smoke checks and monitoring port `3001` health.
The boardgame.io server uses explicit Sentry error capture only, with default
Node auto-instrumentation disabled to avoid OpenTelemetry overhead on the game
server.

To route errors to Discord:

1. Open the Sentry project:

   ```bash
   flyctl apps errors
   ```

2. In Sentry, go to **Settings** → **Integrations** → **Discord** and connect
   the Discord server.
3. Create a project issue alert rule for `open-star-ter-village`.
4. Trigger notifications only for:
   - newly created issues
   - regressions, where a resolved issue becomes unresolved again
5. Add a Discord notification action and route it to the `#errors` channel.

Do not send every event to Discord; use Sentry issue-level notifications to
avoid alert noise.

## Online Multiplayer Configuration

The web app uses a two-process architecture for online multiplayer:

- **Next.js client:** runs on port `3000` locally.
- **Game server:** runs on port `3001` locally using boardgame.io and Socket.IO.

Important implementation decisions archived in
[RFC 005 issue #430](https://github.com/ocftw/open-star-ter-village/issues/430):

- Use `3001` for the game server port.
- Set `NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001` for local development.
- Use `GAME_SERVER_ORIGINS` on the game server to configure allowed client
  origins in production.
- Import `LobbyClient` from `boardgame.io/client` for boardgame.io `0.50.2`.
- Do not pass `numPlayers` to `Client()`; the server enforces player count per
  match.
- Keep `StoreProvider` in `layout.tsx`, not `page.tsx`, so all routes share the
  Redux store.
- Lobby and game room pages are client components, so direct `localStorage`
  access is acceptable there.

## Development Game Harness

The non-production `/dev` route renders the same game view used by active
multiplayer rooms, with a collapsed developer-controls widget layered over it.
The route is unavailable in production builds.

Supported query parameters:

- `user=player1|player2|player3|observer` selects the initial perspective and
  defaults to `player1`.
- `mode=offline|online` selects Local or SocketIO transport and defaults to
  `offline`.
- `seed=<value>` fixes boardgame.io randomness in Offline mode.
- `demo=four-freedoms` forces the existing four-freedoms demo setup in Offline
  mode.

The widget updates `user` and `mode` in the URL without reloading. Changing
perspective preserves the active match; changing transport or reloading starts
a fresh three-player match. Online mode creates an unlisted development match
and does not join the public lobby. Reloading or toggling transport leaves the
previous auto-created Online match in the in-memory game server until restart.

## Architecture

The web app has two runtime processes:

1. **Next.js client** (`packages/webapp`, port `3000` locally) - React 18,
   MUI 5, Redux Toolkit, and boardgame.io React client.
2. **Game server** (`packages/webapp/src/server.ts`, port `3001` locally) -
   boardgame.io server with Socket.IO transport, compiled to
   `packages/webapp/dist/` by `tsconfig.server.json`.

Both processes are started by `pnpm webapp dev`.

### Game State

The web app has two state systems:

- **boardgame.io `GameState`** (`src/game/store/store.ts`) is the authoritative,
  server-synchronized game state for decks, table state, players, and rules.
- **Redux store** (`src/lib/store.ts`, `src/lib/reducers/`) is client-side UI
  state. Selectors live in `src/lib/selector.ts`; hooks live in
  `src/lib/hooks.ts`.

Game moves and mutators operate on boardgame.io state. UI-only concerns belong
in Redux.

## Source Layout

- `src/app/` - Next.js app routes.
- `src/components/` - React UI components.
- `src/components/BoardGame.tsx` - root boardgame.io React client component.
- `src/components/Table/` - shared game board UI.
- `src/components/ActionBoard/` - current-player action controls.
- `src/components/Players/` - player hand and status UI.
- `src/game/` - boardgame.io game definition, moves, state, and card data.
- `src/game/game.ts` - boardgame.io game entrypoint.
- `src/game/moves/` - one file per player action.
- `src/game/store/slice/` - pure state mutators and selectors by domain.
- `src/game/data/card/` - project, job, force, and event card data.
- `src/lib/` - client utilities, Redux store, lobby client, and hooks.
- `src/server.ts` - boardgame.io game server entrypoint.
- `e2e/` - Playwright end-to-end tests.

## Configuration

- `NEXT_PUBLIC_GAME_SERVER_URL` sets the client-visible game server URL.
- `GAME_SERVER_ORIGINS` sets the comma-separated list of allowed client origins
  for the game server in production.
- `PORT` overrides the game server port; it defaults to `3001`.
- `@/*` maps to `packages/webapp/src/*`.

## Coding Constraints

- TypeScript strict mode is enabled; all new code must be strictly typed.
- Use the `@/*` path alias for webapp imports instead of relative paths across
  feature boundaries.
- Game moves should validate preconditions before mutating state.
- Do not use `console.log` in game logic; use structured error handling.
- Use functional React components with hooks.
- Keep pure state mutators in `src/game/store/slice/`.
- Tests currently focus on game core logic; component test coverage is not yet
  broad.

## Assets

If you would like to contribute assets, please create an issue to discuss your
ideas with the team. They may invite you for further discussions. Afterward, you
can create a pull request to upload your contributions.
