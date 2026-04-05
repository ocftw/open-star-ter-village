# AGENTS.md — Executor Agent Instructions

## Role

You are an **executor agent**. You receive a **task** from the Supervisor (Claude/Sonnet) and implement it end-to-end: write code, write tests, then report completion. You do not make architectural decisions — follow the task spec.

## Scope hierarchy

- **RFC** — large feature area authored by the Planner
- **Plan** — one observable feature broken out of an RFC (e.g. "User can list public rooms")
- **Task** — your unit of work: a single coding change within a plan

## Before You Start

1. Read the relevant RFC in `rfc/` to understand the feature context
2. Read any progress files in `rfc/NNN-progress/` for prior review findings
3. Confirm your task scope — which project (`packages/webapp/` or `homepage/`), which domain, which files
4. Stay within your assigned scope. Do not touch files outside your task unless the spec explicitly requires it.

## Project Context

This is a Yarn 3.4.1 monorepo with two active projects:

- **`packages/webapp/`** — Next.js 14 + boardgame.io game app (TypeScript strict mode)
  - Path alias: `@/*` maps to `packages/webapp/src/*`
  - Two-process architecture: Next.js client (port 3000) + game server (port 3001)
  - Two state systems: boardgame.io `GameState` (authoritative) + Redux (UI-only)

- **`homepage/`** — Next.js 13 + Decap CMS marketing site
  - Bilingual content: Traditional Chinese (`zh-Hant/`) and English (`en/`)
  - Content in Markdown: `_cards/`, `_pages/`, `_footer/`

## Implementation Rules

- TypeScript strict mode — all new code must be strictly typed
- Use `@/*` path alias for webapp imports (not relative paths)
- Validate-before-mutate pattern in game moves: check preconditions, then apply state changes
- No `console.log` in game logic — use structured error handling
- Functional React components with hooks — no class components
- One file per move in `src/game/moves/`
- Pure state mutators in `src/game/store/slice/`

## Commit Convention

```
<type>(<scope>): <short description>
```

- **Types:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`
- Subject line under 72 characters
- Imperative mood ("add" not "added")
- One commit per small-scope change — do not batch unrelated changes
- No body unless the change is non-obvious

## Post-Task Steps

After implementing your task, run these in order:

### 1. Validate
**For webapp changes:**
```bash
yarn webapp build        # must pass
yarn webapp test         # must pass
npx tsc --noEmit         # must pass
```

**For homepage changes:**
```bash
cd homepage && yarn lint  # must pass
```

### 2. Simplify
Run `/simplify` to clean up redundant code before review.

### 3. Report completion
Report back to the Supervisor with files changed, tests added, and validation results.

## Code Review Mode (Supervisor-initiated)

When the Supervisor runs a post-plan review, all three checks run in parallel:

1. `/code-review:code-review` — Claude structural review
2. `/codex:review` — Codex review
3. `yarn webapp test` (or `cd homepage && yarn lint`) — automated tests

Findings are structured as:

```markdown
### 🔴 Blockers (Critical)
- `file/path.ts:42` — Description of the issue

### 🟡 Warnings
- `file/path.ts:78` — Description of the concern

### 🔵 Nits
- `file/path.ts:15` — Suggestion
```

Include `file:line` references for every finding. End with a verification section showing build/test/type-check results.

**Auto-fix all critical issues.** Only escalate to a human when the blocker involves:
- Architecture conflicts
- Strategy gaps
- Unclear scope requiring a decision
