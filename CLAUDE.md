# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Open StarTer Village** is an educational board game teaching open-source culture, implemented as a web application. It supports 3–6 players, ~60 minutes per session, in Traditional Chinese and English.

## Commands

### All Workspaces (from root)
```bash
yarn all:dev      # Start dev servers for all projects in parallel
yarn all:build    # Build all projects
yarn all:lint     # Lint all projects
```

### Web App (main game — `packages/webapp`)
```bash
yarn webapp dev        # Start Next.js (port 3000) + game server (port 3001) concurrently
yarn webapp build      # Build Next.js app and compile TypeScript server to dist/
yarn webapp start      # Start production server
yarn webapp test       # Run Jest unit tests (game logic only)
yarn webapp lint       # Run ESLint
```

### Homepage (`homepage/`)
```bash
cd homepage
yarn dev        # Start dev server
yarn lint       # Prettier check + ESLint
yarn lint:fix   # Auto-fix formatting
```

### Single test file
```bash
cd packages/webapp && yarn test --testPathPattern=utils
```

## Architecture

The repo is a **Yarn 3.4.1 monorepo** with three packages:
- `packages/webapp` — The main game app (active development)
- `homepage/` — Marketing site with Decap CMS (separate deployment)
- `google-spreadsheet/` — Legacy Google Apps Script prototype (reference only)

### Webapp: Two-Process Architecture

The webapp runs as **two separate processes**:
1. **Next.js client** (port 3000) — React 18 + MUI 5 + Redux Toolkit UI
2. **Game server** (port 3001) — Custom Node.js server using boardgame.io, compiled from `src/server.ts` to `dist/` via `tsconfig.server.json`

Both are started concurrently by `yarn webapp dev`.

### Game State: Two Parallel State Systems

There are two separate state systems that coexist:

1. **boardgame.io `GameState`** (`src/game/store/store.ts`) — the authoritative, server-synchronized game state. Structure:
   - `decks` — card draw piles (projects, jobs, forces, events)
   - `table` — the shared project board and action slots
   - `players` — per-player state (hand cards, resources)
   - `rules` — game rule configuration

2. **Redux store** (`src/lib/store.ts`, `src/lib/reducers/`) — client-side UI state. Selectors live in `src/lib/selector.ts`, hooks in `src/lib/hooks.ts`.

Game logic (moves, mutations) operates on `GameState` via boardgame.io; UI concerns use Redux.

### Game Logic Layout (`src/game/`)

- `game.ts` — Entry point: defines phases, stages, and wires up moves using the boardgame.io `Game` object
- `moves/` — One file per player action (e.g., `recruit.ts`, `createProject.ts`, `contributeOwnedProjects.ts`)
- `store/slice/` — Pure state mutators and selectors per domain (`deck`, `players`, `projectBoard`, `actionSlots`, etc.)
- `data/card/` — JSON card data (projects, jobs, forces, events)
- `utils.ts` / `utils.test.ts` — Utility functions; this is where Jest tests live

### Component Layout (`src/components/`)

- `BoardGame.tsx` — Root game component, connects boardgame.io client to React
- `Table/` — Shared game board (project slots, action slots)
- `ActionBoard/` — Current player's action controls
- `Players/` — Player hand and status display
- `DevActions/` — Developer tools for testing game state (not shown in production)

### Path Alias

`@/*` maps to `packages/webapp/src/*` (configured in `tsconfig.json`).

## Key Constraints

- **Node.js >= 18** required
- **Yarn 3.4.1** — use project-local yarn, not system yarn
- TypeScript strict mode is enabled; all new code must be strictly typed
- Tests exist only for game core logic (`src/game/utils.test.ts`); component tests are not yet in place
- CI runs `yarn webapp build` on Node 18.x and 20.x on pushes/PRs to main

## Agent Workflow

This project uses a multi-agent development workflow with three roles:

- **Planner** (Claude / Opus 4.6): RFC writing, architecture decisions, plan breakdown
- **Supervisor** (Claude / Sonnet 4.6): Plan oversight, review orchestration, merge requests
- **Executor** (Codex plugin / gpt-5.4): Task implementation and testing

### Process

```
RFC (Planner)
  → Plans (Planner breaks RFC into observable features)
    → Tasks (Supervisor breaks each plan into coding-agent units)
      → Implement + Test in parallel (1–N Executor agents via Codex plugin)
        → /simplify (post-task cleanup)
          → Review + Test in parallel:
              1. /code-review:code-review
              2. /codex:review
              3. yarn webapp test (or homepage lint)
            → Auto-fix all critical issues
              (escalate to human only for: architecture conflicts, strategy gaps, unclear scope)
              → Commit → Push → Raise MR
```

### Scope hierarchy

| Level | Owner | Description |
|-------|-------|-------------|
| **RFC** | Planner | Large feature area (e.g. "Create a game lobby") |
| **Plan** | Planner → Supervisor | One observable feature (e.g. "User can list public rooms") |
| **Task** | Supervisor → Executor | Single coding unit — implement + test, one agent handles end-to-end |

See `rfc/002-agent-workflow-role-separation.md` for background.
