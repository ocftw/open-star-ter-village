# RFC 005: Online Multiplayer Support

**Status:** In Progress
**Author:** @ocftw
**Created:** 2026-04-05
**Related:** [PR #345](https://github.com/ocftw/open-star-ter-village/pull/345)

## Description

Open StarTer Village currently runs as a single-browser experience. All players
share one machine via tabs in `DevView`, using boardgame.io's `Local()` transport
(or `SocketIO` pointed at localhost in dev). There is no way for players on
separate devices to create, discover, or join a game session.

The boardgame.io game server already exists (`src/server.ts`) and exposes
SocketIO-based multiplayer, but three critical pieces are missing:

1. **Match lifecycle** — no API calls to create or join matches; `matchID` and
   `playerID` are hardcoded.
2. **Lobby UI** — no page for players to find and enter a game room.
3. **Game room flow** — no waiting-room → board transition; no credential
   storage for reconnection.

Without these, the game cannot be played online by separate users.

## Goals

- Players on different devices can create, discover, and join a match through a
  lobby UI.
- Once all seats are filled, players transition into the game board and play in
  real-time via WebSocket (SocketIO).
- A player who refreshes the page can reconnect to their seat without losing
  their position.
- The existing `DevView` local/offline mode continues to work for development
  and testing.

## Non-Goals

- **Deployment platform and infrastructure** — this RFC does not prescribe how
  the Next.js client and boardgame.io server are deployed, reverse-proxied, or
  scaled.
- **User accounts and authentication** — players are identified by a
  self-chosen display name and boardgame.io-issued per-match credentials, not by
  a persistent account.
- **Spectator chat, rematch, or social features.**
- **Matchmaking or ELO** — players manually create and join rooms.
- **Mobile-specific UI optimisations.**

## Solutions

### Architecture Overview

```
┌──────────────┐         ┌──────────────────────┐
│  Next.js App │  REST   │  boardgame.io Server  │
│  (port 3000) │────────▶│  (port 8000)          │
│              │         │                       │
│  /lobby      │  Lobby  │  GET/POST /games/     │
│  /game/[id]  │  API    │  OpenStarTerVillage/* │
│              │         │                       │
│  Boardgame   │  WS     │  SocketIO transport   │
│  component   │◀═══════▶│  (real-time state)    │
└──────────────┘         └──────────────────────┘
```

boardgame.io 0.50.2's `Server()` already exposes a Lobby REST API alongside the
SocketIO transport. The plan uses these built-in endpoints — no custom backend
logic is needed.

### 1. Game Definition — Add `name`

**File:** `packages/webapp/src/game/game.ts`

Add `name: 'OpenStarTerVillage'` to the exported `Game` object. Without an
explicit name boardgame.io defaults to `"default"`, producing unpredictable
lobby paths (`/games/default/...`).

```ts
export const OpenStarTerVillage: Game<GameState> = {
  name: 'OpenStarTerVillage',   // ← add this
  setup: ({ ctx }) => { ... },
  phases: { ... },
  turn: { ... },
  playerView: ({ G, ctx, playerID }) => { ... },
};
```

### 2. Server — Configurable CORS Origins

**File:** `packages/webapp/src/server.ts`

Currently the server only accepts `Origins.LOCALHOST_IN_DEVELOPMENT`, which
blocks all connections in production. Add support for an env var:

```ts
const origins = process.env.GAME_SERVER_ORIGINS
  ? process.env.GAME_SERVER_ORIGINS.split(',').map(s => s.trim())
  : [Origins.LOCALHOST_IN_DEVELOPMENT];

const server = Server({ games: [game], origins });
```

| Env var | Side | Purpose |
|---------|------|---------|
| `GAME_SERVER_ORIGINS` | Server | Comma-separated allowed origins for CORS |
| `NEXT_PUBLIC_GAME_SERVER_URL` | Client | Base URL of the game server (default `http://localhost:8000`) |

A `.env.development` file in `packages/webapp/` provides defaults:

```
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:8000
```

### 3. Lobby Client Utility

**New file:** `packages/webapp/src/lib/lobbyClient.ts`

A thin module that exports a configured `LobbyClient` instance and shared constants:

```ts
import { LobbyClient } from 'boardgame.io/lobby';

export const GAME_SERVER_URL =
  process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:8000';
export const GAME_NAME = 'OpenStarTerVillage';

export const lobbyClient = new LobbyClient({ server: GAME_SERVER_URL });
```

All lobby and game-room code imports from here — no hardcoded URLs elsewhere.

The Lobby REST API provided by boardgame.io:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/games/OpenStarTerVillage/create` | POST | Create a match, returns `{ matchID }` |
| `/games/OpenStarTerVillage` | GET | List matches (filterable by `isGameover`) |
| `/games/OpenStarTerVillage/{id}` | GET | Get match metadata (players, seats) |
| `/games/OpenStarTerVillage/{id}/join` | POST | Join a seat, returns `{ playerCredentials }` |
| `/games/OpenStarTerVillage/{id}/leave` | POST | Leave a match |

### 4. Credential Storage

**New file:** `packages/webapp/src/lib/matchCredentials.ts`

boardgame.io issues `playerCredentials` when a player joins a match. Every
subsequent move must include these credentials. Storing them in `localStorage`
(keyed by `matchID`) allows reconnection after a page refresh.

```ts
export interface MatchCredentials {
  matchID: string;
  playerID: string;
  playerCredentials: string;
  playerName: string;
}

export function saveCredentials(creds: MatchCredentials): void;
export function loadCredentials(matchID: string): MatchCredentials | null;
export function clearCredentials(matchID: string): void;
```

### 5. Refactor `BoardGame.tsx`

**File:** `packages/webapp/src/components/BoardGame.tsx`

| Change | Reason |
|--------|--------|
| Accept optional `credentials` prop | Pass to boardgame.io client for authentication |
| Use `GAME_SERVER_URL` for SocketIO server | Remove hardcoded `localhost:8000` |
| Remove hardcoded `numPlayers: 3` | Server enforces numPlayers per match |
| Keep `isLocal` / `gameConfig` props | DevView continues working unchanged |

The `Board` component and all game UI remain untouched.

### 6. Lobby Page

**New file:** `packages/webapp/src/app/lobby/page.tsx` (client component)

Three sections, built with MUI:

**Create Match**
- Text field for player name (persisted in `localStorage` across sessions)
  - Validation: 1–20 characters after trimming whitespace; must contain at least
    one non-whitespace character; no further character restrictions (Unicode
    names are allowed). These limits are simple, inclusive, and sufficient for a
    casual game where names are not unique identifiers.
- Dropdown for number of players (3–6)
- "Create Game" button
- Flow: `createMatch()` → auto-join seat 0 → save credentials → redirect to `/game/{matchID}`

**Match List**
- Fetched via `listMatches()` on mount + auto-refresh every 10 seconds + manual
  refresh button. Auto-refresh keeps the list current without requiring user
  action; 10 seconds is frequent enough for discovery while keeping API load low.
- Shows: match ID (truncated), seats filled / total, creation time, status badge
- "Join" button per joinable match

The lobby derives a display status for each match from the metadata returned by
`getMatch()` / `listMatches()`:

| Derived Status | Condition | Visible in Lobby? | Joinable? |
|----------------|-----------|-------------------|-----------|
| **Waiting** | Has open seats, game not started | Yes | Yes |
| **In Progress** | All seats filled, `gameover` is `undefined` | Yes (greyed) | No |
| **Finished** | `gameover` is set (a player has won) | No | No |
| **Abandoned** | All players have left (every seat's `name` is unset or all connections dropped) | No | No |

> **Note:** The game currently has no `endIf` condition, so `gameover` will never
> be set until one is implemented. For now, matches will show as "In Progress"
> indefinitely after all seats fill. This is acceptable for MVP — adding an
> `endIf` victory condition to the game definition is tracked separately and will
> make the "Finished" status work automatically.

**Join Flow**
- Finds the first open seat
- Calls `joinMatch()` with player name
- Saves credentials
- Redirects to `/game/{matchID}`

### 7. Game Room Page

**New file:** `packages/webapp/src/app/game/[matchID]/page.tsx` (client component)

Two states:

**Waiting Room** — shown when not all seats are filled:
- Match ID and player count
- List of joined players (name, seat index)
- Shareable URL for inviting others
- "Leave Match" button — calls the `/leave` endpoint, clears stored credentials,
  and redirects back to `/lobby`. Players should be able to exit before a game
  starts (e.g., joined the wrong room, changed their mind).
- Auto-polls `getMatch()` every 3 seconds

**Game Board** — shown when all seats are filled, renders `<Boardgame>` with:
- `isLocal={false}`
- `matchID` from URL
- `playerID` and `credentials` from localStorage

**Observer Mode** — if no credentials exist for this matchID, the board renders
without a `playerID`; the viewer sees game state without move controls.
Observers use the existing `playerView`, which hides all player hands from
non-players. This is intentional: sharing hand information is a social game
mechanic left to each player's discretion.

### 8. Home Page Update

**File:** `packages/webapp/src/app/page.tsx`

The current home page determines transport mode with inverted logic — production
uses `Local()` and development uses `SocketIO`:

```ts
// Current (BEFORE this RFC):
const getIsLocal = async () => {
  'use server'
  return process.env.NODE_ENV === 'production';  // production = local-only
}
```

This RFC replaces that logic entirely. The home page becomes a landing page:

- Remove the `getIsLocal()` server action — transport mode is no longer decided
  here; online games always use `SocketIO` via the game room page, and DevView
  always uses `Local()`.
- Add a "Play Online" button/link routing to `/lobby`.
- Render `<DevView isLocal={true} />` only when `NODE_ENV === 'development'` or
  the `?dev=true` query param is present. DevView always uses `Local()` transport
  regardless of environment, since its purpose is single-browser development.

### 9. Move `StoreProvider` to Root Layout

**File:** `packages/webapp/src/app/layout.tsx`

The Redux `<StoreProvider>` is currently placed inside `page.tsx` (the home
page), which means it only wraps that single route. The new `/lobby` and
`/game/[matchID]` pages would not have access to the Redux store, causing
crashes if any child component dispatches actions (e.g. the wizard reducer).

Move `<StoreProvider>` into `layout.tsx` so it wraps all routes:

```tsx
import StoreProvider from './StoreProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

Remove the `<StoreProvider>` wrapper from `page.tsx` after this move.

### Route Summary

| Route | Purpose |
|-------|---------|
| `/` | Landing — links to lobby; shows DevView in dev mode |
| `/lobby` | Create, list, and join matches |
| `/game/[matchID]` | Waiting room → game board |

### Data Flow — Full Match Lifecycle

```
1. Player A opens /lobby
2. Player A creates a 3-player match
   → POST /games/OpenStarTerVillage/create  { numPlayers: 3 }
   ← { matchID: "abc123" }
3. Player A auto-joins seat 0
   → POST /games/OpenStarTerVillage/abc123/join  { playerID: "0", playerName: "Alice" }
   ← { playerCredentials: "cred-xxx" }
4. Player A is redirected to /game/abc123 (waiting room)
5. Player A shares the URL with friends

6. Player B opens /lobby, sees match abc123, clicks Join
   → joins seat 1, redirected to /game/abc123
7. Player C does the same → joins seat 2

8. All 3 seats filled — waiting room transitions to game board
9. Each client connects via SocketIO with matchID + playerID + credentials
10. Game plays out via boardgame.io's real-time state sync
11. On page refresh: credentials loaded from localStorage → reconnect
```

### Files Changed

All paths below are relative to `packages/webapp/`.

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/game/game.ts` | Add `name: 'OpenStarTerVillage'` |
| Modify | `src/server.ts` | Configurable CORS origins via env var |
| Modify | `src/components/BoardGame.tsx` | Accept credentials, dynamic server URL, remove hardcoded `numPlayers` |
| Modify | `src/app/page.tsx` | Remove `getIsLocal()`, add lobby link, gate DevView |
| Modify | `src/app/layout.tsx` | Move `StoreProvider` here so all routes share Redux store |
| Create | `.env.development` | Default env vars |
| Create | `src/lib/lobbyClient.ts` | LobbyClient instance + constants |
| Create | `src/lib/matchCredentials.ts` | localStorage credential helpers |
| Create | `src/app/lobby/page.tsx` | Lobby UI |
| Create | `src/app/game/[matchID]/page.tsx` | Game room + waiting room |

**No changes to:** `DevView.tsx`, game logic (`moves/`, `store/`), Redux
reducers, or any existing game UI components.

### Known Limitations & Proposed Mitigations

#### DevView Only Supports 2 Players

The current `DevView` hardcodes exactly 2 player views (seats 0 and 1) plus one
observer view, but the game is designed for 3–6 players. This RFC claims "No
changes to DevView" — that remains true, but developers should be aware that
DevView is insufficient for testing 3+ player games locally.

**Proposed mitigation:** Separately from this RFC, make DevView accept a
`numPlayers` query param (e.g. `?dev=true&players=4`) and dynamically render
that many player panels. This is a DevView-only improvement and does not affect
the online multiplayer design.

#### Create-Match Auto-Join Race Condition

When a player creates a match, the match becomes visible in the lobby list
immediately, but the creator's auto-join of seat 0 is a separate API call. In
theory, another player polling the lobby could see the new match and join seat 0
before the creator does.

**Proposed mitigation:** Since `createMatch` returns a unique `matchID`, the
creator calls `joinMatch` immediately in the same async flow before redirecting.
The window is sub-second and the match won't appear in another player's list
until their next poll cycle (3s), making a collision practically impossible. No
server-side changes are needed — the existing sequential `createMatch → joinMatch`
is sufficient.

#### Concurrent Last-Seat Join Conflict

If two players click "Join" simultaneously for a match with only one remaining
seat, one `joinMatch` call will succeed and the other will receive an error from
the boardgame.io server (HTTP 409 Conflict).

**Proposed mitigation:** The lobby join flow should handle non-2xx responses
from `joinMatch()` gracefully:

1. Catch the error and show a toast/snackbar: _"This seat was just taken.
   Refreshing match list…"_
2. Auto-refresh the match list so the player sees the updated state.
3. If the match is now full, disable the Join button for that match.

No retry or complex locking is needed — the server is the authority and the
client simply reacts to the rejection.

## Rejected Solutions

### Custom WebSocket Server

Replace boardgame.io server entirely with a hand-rolled WebSocket server. Pros:
full control over protocol. Rejected because boardgame.io already solves state
sync, conflict resolution, and reconnection — reimplementing it is massive
effort with no benefit.

### boardgame.io `<Lobby>` React Component

Use the built-in `<Lobby>` component for zero UI work. Rejected because it has
an opinionated UI with limited customisation and does not integrate well with the
Next.js App Router; we need custom UX that fits the game's MUI design system.

### NextAuth + Database for User Accounts

Add persistent identity with friend lists. Rejected as over-engineered for MVP;
display names and per-match credentials are sufficient. Auth complexity is out of
scope.

### Peer-to-Peer (WebRTC)

No server needed. Rejected because it requires STUN/TURN for NAT traversal,
boardgame.io does not support WebRTC, and game state requires an authoritative
server — an architectural mismatch.

## Testing Plan

1. `yarn webapp dev` — start Next.js (port 3000) and game server (port 8000)
2. Navigate to `http://localhost:3000/lobby`
3. Create a 3-player match as "Alice"
4. Open two more browser tabs → lobby → join the same match as "Bob" and "Charlie"
5. All three tabs transition from waiting room to game board
6. Play through several turns — moves sync across all tabs in real time
7. Refresh one tab — credentials from localStorage allow seamless reconnection
8. Verify `http://localhost:3000/?dev=true` still shows DevView with local mode
9. `yarn webapp build` — no type errors
10. `yarn webapp test` — existing Jest tests pass

## SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| Move round-trip latency | < 300 ms | LAN/broadband; boardgame.io SocketIO transport |
| Waiting room poll interval | 3 s | `getMatch()` polling until all seats filled |
| Reconnection on refresh | < 5 s | Credential lookup from localStorage + SocketIO reconnect |
| Breaking changes to existing routes | 0 | `/`, DevView, all existing game logic unaffected |
