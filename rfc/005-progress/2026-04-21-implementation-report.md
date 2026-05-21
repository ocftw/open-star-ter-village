# RFC 005 Implementation Report
**Date:** 2026-04-21
**Commit:** ea54071

## Status: All stories complete ✅

## Verification Results

| Check | Result |
|-------|--------|
| `yarn webapp build` | ✅ Pass — 0 type errors |
| `yarn webapp test` | ✅ Pass — 52/52 tests |
| Routes in build | `/`, `/lobby`, `/game/[matchID]` |

## Story Outcomes

| Story | Tasks | Result | Notes |
|-------|-------|--------|-------|
| A — Game Server Foundations | A1, A2, A3 | ✅ | |
| B — Shared Client Utilities | B1, B2 | ✅ | `credential` field name (not `playerCredentials`) — consistent throughout |
| C — App Shell Refactor | C1, C2 | ✅ | |
| D — BoardGame Upgrade | D1 | ✅ | `numPlayers` kept as optional (required for Local mode) |
| E — Lobby Page | E1, E2, E3 | ✅ | `lobby/actions.ts` extracted for cleaner separation |
| F — Game Room Page | F1, F2, F3 | ✅ | See deviation note below |

## Deviations from RFC

### Host-controlled game start (Story F)
RFC specifies auto-transition when all seats fill. Implementation adds a "Start Game" button for the host (seat 0). All other players see "Waiting for host to start." This is a UX improvement: prevents accidental starts when a player joins but isn't ready.

### `lobby/actions.ts` added
RFC specifies only `lobby/page.tsx`. Codex extracted API helpers into `lobby/actions.ts`. Cleaner separation of concerns; no functional difference.

### `matchCredentials.ts` field name
RFC uses `playerCredentials`; implementation uses `credential`. Internally consistent across all files. No functional impact.

## Gitignore Fix
Root `.gitignore` had `.env*` (too broad). Added `!.env.development` and `!**/.env.development` exceptions so the development defaults file can be committed without secrets risk.

## Next Steps
- Manual end-to-end test: 3-tab game creation → lobby → join → waiting room → Start Game → board
- Raise PR from `worktree-rfc-005` → `main`
- After merge: update RFC 005 status to `Complete`
