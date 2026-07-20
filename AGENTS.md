# AGENTS.md - Executor Agent Instructions

> Project context, architecture, commands, and coding constraints are in
> `README.md`, `packages/webapp/README.md`, and `homepage/README.md`. Read the
> relevant public docs first. This file covers executor-specific behavior only.

## Role

You are an **executor agent**. You receive a **task** from the Supervisor (Claude/Sonnet) and implement it end-to-end: write code, write tests, then report completion. You do not make architectural decisions — follow the task spec.

## Scope hierarchy

- **RFC** — large feature area authored by the Planner
- **Plan** — one observable feature broken out of an RFC
- **Task** — your unit of work: a single coding change within a plan

## Before You Start

1. Read the relevant public docs for project context and architecture
2. Read the relevant RFC in `rfc/` to understand the feature context
3. Read any progress files in `rfc/NNN-progress/` for prior review findings
4. Confirm your task scope — which project (`packages/webapp/` or `homepage/`), which domain, which files
5. Stay within your assigned scope. Do not touch files outside your task unless the spec explicitly requires it.

## Agent Skills

Project-owned skills live with the project they operate on. From the repository
root, use:

- Webapp deploy smoke test:
  `packages/webapp/skills/webapp-deploy-smoke-test/SKILL.md`

From `packages/webapp/`, use:

- Webapp deploy smoke test:
  `skills/webapp-deploy-smoke-test/SKILL.md`

## Commits

Follow the project commit convention in `README.md`.

## Pull Requests

If asked to create or update a pull request, first read `CONTRIBUTING.md` and
`.github/pull_request_template.md`. Open it as a draft while evidence is
incomplete, put durable evidence for each material claim in the PR body, and do
not mark it ready until the evidence gate and required CI pass. Never fabricate
or infer evidence from code alone. After material commits or evidence changes,
update the PR body and re-request Copilot review. Resolve every human and Copilot
review conversation before merge.

## Post-Task Steps

After implementing your task, run these in order:

### 1. Validate

**For webapp changes:**
```bash
yarn webapp build        # must pass
yarn webapp test         # must pass
yarn webapp exec tsc --noEmit  # must pass
```

**For homepage changes:**
```bash
yarn homepage lint        # must pass
```

### 2. Simplify
Run `/simplify` to clean up redundant code before review.

### 3. Report completion
Report back to the Supervisor with files changed, tests added, and validation results.

## Code Review Mode (Supervisor-initiated)

When the Supervisor runs a post-plan review, all three checks run in parallel:

1. `/code-review:code-review` — Claude structural review
2. `/codex:review` — Codex review
3. `yarn webapp test` (or `yarn homepage lint`) — automated tests

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
