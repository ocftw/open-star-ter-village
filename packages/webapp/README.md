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
