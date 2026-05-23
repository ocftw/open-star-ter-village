# Open StarTer Village Web App

Open StarTer Village Web App is the online version of the Open StarTer Village
board game. It supports 3-6 players, approximately 60 minutes per session, and
Traditional Chinese / English content.

Rulebook: [Rulebook of Open StarTer Village](https://drive.google.com/file/d/1gBGKhavLdDQ-J1elxQNN6E7Sdz0ZBTeO/view?usp=drive_link)

## Runtime

- Next.js client: `http://localhost:3000`
- Game server: `http://localhost:3001`
- Node.js: `>=18`
- Package manager: repository Yarn `3.4.1`

## Commands

Run these from the repository root:

```bash
yarn webapp dev        # Start the Next.js client and game server
yarn webapp build      # Build Next.js and compile the game server
yarn webapp start      # Start the built app and game server
yarn webapp test       # Run Jest tests
yarn webapp lint       # Run ESLint
```

Run all Yarn workspaces from the repository root:

```bash
yarn all:dev
yarn all:build
yarn all:lint
```

Run a single Jest test file from this package:

```bash
yarn test --testPathPattern=utils
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
- Node.js 18+ and Yarn 3.4.1 for local verification.

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

Both Fly configs use one Fly app and one container. The Next.js client listens
on port `3000`, and the boardgame.io server listens on port `3001`.

Required configuration:

- `NEXT_PUBLIC_GAME_SERVER_URL`: public URL for the game server. This is inlined
  by Next.js at build time, so set it as a Docker build argument before
  `next build`; changing a runtime env var later will not update the browser
  bundle.
- `GAME_SERVER_ORIGINS`: comma-separated allowed browser origins for the game
  server CORS policy. Set this as a Fly secret.

Example:

```bash
fly secrets set GAME_SERVER_ORIGINS=https://open-star-ter-village.fly.dev
fly deploy --build-arg NEXT_PUBLIC_GAME_SERVER_URL=https://open-star-ter-village.fly.dev:3001
```

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

Match state is in memory for alpha. Restarts lose active matches until the
post-alpha persistence task lands.

Run the [external-network smoke test](../../docs/deploy-smoke-test.md) after
every deploy.

### UptimeRobot Monitoring

Fork maintainers can mirror the alpha uptime checks with a free UptimeRobot
account. Use the free 5-minute monitoring interval and create two HTTP(s)
monitors:

1. **Health endpoint**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `<app> health`
   - URL to monitor: `https://<app>/health`
   - Monitoring Interval: `5 minutes`
   - HTTP Method: `GET`
2. **Game route**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `<app> game route`
   - URL to monitor: `https://<app>/games/OpenStarTerVillage`
   - Monitoring Interval: `5 minutes`
   - HTTP Method: `GET`

To send alerts to Discord, use the same ops channel webhook that receives
deployment notifications. In UptimeRobot, add an alert contact using the
Discord webhook URL, then attach that contact to both monitors. Keep the webhook
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

Important RFC 005 implementation decisions:

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

## Architecture

The web app has two runtime processes:

1. **Next.js client** (`packages/webapp`, port `3000` locally) - React 18,
   MUI 5, Redux Toolkit, and boardgame.io React client.
2. **Game server** (`packages/webapp/src/server.ts`, port `3001` locally) -
   boardgame.io server with Socket.IO transport, compiled to
   `packages/webapp/dist/` by `tsconfig.server.json`.

Both processes are started by `yarn webapp dev`.

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
