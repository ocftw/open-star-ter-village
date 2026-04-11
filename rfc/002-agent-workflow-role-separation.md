# RFC 002: Agent Workflow & Role Separation

**Status:** In Review
**Author:** @ben196888
**Created:** 2026-03-23
**Related:** [Issue #346](https://github.com/ocftw/open-star-ter-village/issues/346), [PR #335](https://github.com/ocftw/open-star-ter-village/pull/335)

## Description

During the development of PR #335 (`feature/align-game-rule-to-released-version`), we validated a multi-agent workflow using 3 Claude Code agents + 3 Codex agents running in parallel across game logic, architecture, and UI domains. This approach caught more issues than single-pass review and enabled deeper domain-specific analysis.

However, the current process has friction:

1. **No formalized roles** — Claude is used for both planning and execution, which is expensive when Codex can handle implementation at lower token cost.
2. **Rigid agent structure** — the 3-domain pattern (game logic, architecture, UI) was validated for the webapp but doesn't generalize to the homepage project or smaller changes.
3. **No reusable review process** — code review was done ad-hoc in PR comments rather than through a repeatable skill.

This RFC formalizes agent roles, defines project-aware review strategies, and introduces a `/code-review:code-review` skill for self-service code review.

## Goals

- Define three distinct agent roles (Planner, Supervisor, Executor) with clear model assignments and responsibilities
- Reduce Opus token usage by delegating implementation to Codex executors
- Create a `/code-review:code-review` skill that adapts review strategy based on project type and change scope
- Support the monorepo structure — different review strategies for webapp vs homepage
- Enable maintainers and contributors to self-review PRs without consuming tokens via GitHub hooks

## Non-Goals

- Automating code review via GitHub Actions or webhooks (token cost risk from external triggers)
- Mandating a fixed number of review agents per PR
- Replacing human code review — this augments, not replaces, maintainer judgment
- Defining `.claude/settings.json` configuration (covered in RFC 003)
- Defining the RFC folder structure or template (covered by RFC 001)

## Solutions

### 1. Role Definitions

Three roles with specific model assignments:

| Role | Model | Responsibility | When Used |
|------|-------|----------------|-----------|
| **Planner** | Claude / Opus 4.6 | RFC writing, architecture decisions, plan mode, complex analysis | Starting new features, designing specs, breaking down large tasks |
| **Supervisor** | Claude / Sonnet 4.6 | Code review, oversight, progress tracking, consolidation | PR reviews, mid-implementation checkpoints, quality gates |
| **Executor** | Codex / gpt-5.4 | Code implementation, file edits, test writing, refactoring | Implementing planned tasks, writing tests, mechanical changes |

**Role boundaries:**

- **Planner** produces specs and plans; never writes production code directly. Uses plan mode to align with the user before handing off to executors.
- **Supervisor** reviews executor output. Uses Sonnet for cost-efficient oversight and Codex for deeper domain-specific analysis. Consolidates findings from parallel review agents.
- **Executor** receives scoped tasks from the Planner's output and implements them. Stays within the assigned scope (project and domain). Runs validation before reporting completion.

All roles share the same commit conventions (Conventional Commits) and validation checklist.

### 2. Project-Aware Review Strategy

Instead of hardcoding 3 domain agents, the review strategy adapts to the project and change scope.

**Webapp review domains:**

| Domain | Scope | Files |
|--------|-------|-------|
| Game Logic | Moves, handlers, state mutations, rules, tests | `src/game/**` |
| Architecture | Types, state management, build config, server, dependencies | `src/server.ts`, `src/lib/**`, `tsconfig*.json`, `package.json` |
| UI | Components, props, hooks, accessibility, styles | `src/components/**`, `src/pages/**` |

**Homepage review domains:**

| Domain | Scope | Files |
|--------|-------|-------|
| Content & CMS | Card data, page content, footer, CMS config | `_cards/`, `_pages/`, `_footer/`, `src/CMS/` |
| Components & Styling | Layouts, components, CSS, i18n | `src/components/`, `src/layouts/`, `public/css/` |

**Scaling heuristic:**

| Project | Default Agents | When to Scale Up |
|---------|---------------|-----------------|
| webapp | 1–3 depending on change scope | Large PRs touching multiple domains → up to 3 agents |
| homepage | 1 (content + styling combined) | CMS schema changes or i18n overhaul → 2 agents |
| cross-project | 1 per affected project | Monorepo config changes → add 1 infra agent |

**Decision rule:** Count affected domains, not files. A 50-file change in one domain = 1 agent. A 10-file change across 3 domains = 3 agents.

**No fixed agent cap.** Spawn as many executor agents as there are parallel tasks. For post-plan review, run all three review checks in parallel.

### 3. Development Process

```
RFC (Planner / Opus)
  → Plans: break RFC into observable features (Planner)
    → Tasks: break each plan into coding-agent units (Supervisor)
      → Implement + Test in parallel (1–N Executor / Codex agents)
        → /simplify per task (post-task cleanup)
          → Review + Test in parallel (post-plan):
              1. /code-review:code-review
              2. /codex:review
              3. yarn webapp test (or homepage lint)
            → Auto-fix all critical issues
              (escalate only: architecture conflicts, strategy gaps, unclear scope)
              → Commit → Push → Raise MR (Supervisor)
```

**Process notes:**

- **RFC → Plans:** The Planner breaks a large RFC (e.g. "game lobby") into plans — each plan is one observable feature a Supervisor can verify end-to-end (e.g. "User can list public rooms").
- **Plans → Tasks:** The Supervisor breaks each plan into tasks — the smallest coding unit an executor can complete independently: implement + test + validate.
- **Parallel execution:** The Supervisor spawns 1–N Codex executor agents in parallel, one per task. No fixed cap — maximize parallelism across non-overlapping tasks.
- **Post-task cleanup:** After each task, run `/simplify` to detect and remove redundant code before review.
- **Post-plan review:** All three checks run in parallel — Claude review, Codex review, and automated tests.
- **Auto-fix:** Executors fix all critical findings automatically. Human escalation only for architecture conflicts, strategy gaps, or unclear scope.

### 4. Code Review Output Format

All review agents (regardless of role or model) produce findings in this structure:

```markdown
## [Domain Name] Review

### 🔴 Blockers (Critical)
Must fix before merge.
- `file/path.ts:42` — Description of the issue

### 🟡 Warnings
Should fix but won't break functionality.
- `file/path.ts:78` — Description of the concern

### 🔵 Nits
Style, naming, minor improvements.
- `file/path.ts:15` — Suggestion

### ✅ Verification
- [ ] `yarn webapp build` — pass/fail
- [ ] `yarn webapp test` — pass/fail
- [ ] `npx tsc --noEmit` — pass/fail
```

When multiple agents run in parallel, the Supervisor consolidates their findings into a single structured comment.

### 5. `/code-review:code-review` Skill

A Claude Code plugin skill that maintainers and contributors invoke manually. **Not attached to GitHub hooks or actions.** This skill is a future deliverable of this RFC — it does not exist yet.

**Three invocation modes:**

| Invocation | Behavior |
|------------|----------|
| `/code-review:code-review` | Review current branch vs base branch (git diff) |
| `/code-review:code-review 335` | Review PR #335 by number (via `gh pr diff`) |
| `/code-review:code-review https://github.com/.../pull/335` | Review PR by URL |

**Skill behavior:**

1. Determine the diff (from branch, PR number, or URL)
2. Identify affected projects (webapp, homepage, or both)
3. Map changed files to review domains
4. Launch one agent per affected domain (soft cap: 3)
5. Each agent reviews its domain and produces structured findings
6. Consolidate into a single summary with verification results
7. Post as PR comment (if PR exists) or output to console

### 6. AGENTS.md Rewrite

Replace the current generic `AGENTS.md` (254 lines, duplicates CLAUDE.md and README) with focused Codex executor instructions (~70 lines). See the updated `AGENTS.md` file for the full content.

**What gets cut:** project overview, repo structure, tech stack, setup instructions, contribution workflow, troubleshooting, future enhancements, resource links — all already in CLAUDE.md or README.

**What gets added:** role context, RFC awareness, domain scoping, commit conventions, validation checklist, code review output format.

### 7. Permission Guidelines (Per-Role)

Claude Code permissions (`.claude/settings.json`) cannot enforce role-based access — all agents share the same permission set. The table below documents the **intended** permissions per role as a convention guideline. The actual `.claude/settings.json` configuration (union of all role permissions, deny list, settings file separation) is defined in [RFC 003](./003-permissions-hands-free-execution.md).

| Permission | Planner | Supervisor | Executor | Notes |
|------------|:-------:|:----------:|:--------:|-------|
| `Edit/Write(rfc/**)` | ✅ create | ✅ update | ❌ | Planner drafts RFCs; Supervisor updates progress |
| `Edit/Write(.claude/commands/**)` | ✅ | ❌ | ❌ | Only Planner creates/updates skills |
| `Edit/Write(packages/webapp/src/**)` | ❌ | ❌ | ✅ | Executor writes production code |
| `Edit/Write(homepage/**)` | ❌ | ❌ | ✅ | Executor writes homepage code/content |
| `gh pr create/edit` | ❌ | ✅ | ❌ | Supervisor manages PRs |
| `gh pr comment` | ❌ | ✅ | ❌ | Supervisor posts review findings |
| `gh pr view/diff` | ✅ | ✅ | ❌ | Read-only for Planner context |
| `yarn build/test/lint`, `tsc` | ❌ | ✅ | ✅ | Validation commands |
| `git add/commit` | ✅ | ✅ | ✅ | All roles can commit within scope |
| `git push origin <branch>` | ✅ | ✅ | ✅ | Feature branches only |
| `git push --force` | ❌ | ✅ | ✅ | Allowed on non-protected branches |
| `git push origin main/master` | ❌ | ❌ | ❌ | **Always denied** |
| `git reset --hard` | ❌ | ❌ | ❌ | **Always denied** |

> **Current limitation:** These role boundaries are enforced by convention (AGENTS.md instructions, skill prompts), not by tooling. `.claude/settings.json` grants the union of all role permissions. Future work may explore per-agent permission scoping if Claude Code or Codex CLI adds support.

## Rejected Solutions

### Fixed 3-domain agent pattern
The original issue proposed always using 3 agents (game logic, architecture, UI). Rejected because: (a) the homepage project doesn't have game logic, (b) small changes don't warrant 3 agents, (c) token cost scales linearly with agent count. The project-aware strategy with a soft cap is more flexible and cost-effective.

### Single-agent review
Using one agent for all review work. Rejected because: PR #335 demonstrated that parallel domain-scoped agents catch more issues than a single pass. The heuristic-based scaling preserves this benefit while avoiding unnecessary agent spawning for small changes.

### GitHub Action–triggered review
Attaching the review skill to a GitHub Action that triggers on PR events. Rejected because: any external actor can open a PR or issue, which would consume tokens uncontrollably. Manual invocation by maintainers/contributors keeps token spend intentional.

### Claude-only workflow (no Codex)
Using Claude for both planning and execution. Rejected because: Opus tokens are significantly more expensive than Codex/gpt-5.4 for implementation tasks. Delegating execution to Codex reduces cost while maintaining quality for mechanical coding work.

## Testing Plan

1. **Skill smoke test (webapp):** Create a test branch with webapp changes across multiple domains. Invoke `/code-review:code-review` and verify it:
   - Correctly identifies affected webapp domains
   - Launches the right number of agents (≤3)
   - Produces structured output (Blockers/Warnings/Nits)
   - Runs verification commands

2. **Skill smoke test (homepage):** Create a test branch with homepage content changes. Invoke `/code-review:code-review` and verify it:
   - Uses homepage-specific domain definitions
   - Launches 1 agent (content + styling combined for small changes)

3. **PR number invocation:** Run `/code-review:code-review 335` and verify it fetches the PR diff and reviews it correctly.

4. **PR URL invocation:** Run `/code-review:code-review https://github.com/ocftw/open-star-ter-village/pull/335` and verify URL parsing works.

5. **AGENTS.md validation:** Have a Codex executor agent read the new AGENTS.md and confirm it can extract: its role, the validation commands, commit convention, and review output format.

6. **No regressions:** Run `yarn webapp build` and `yarn webapp test` to confirm doc-only changes don't break anything.

## SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| Review turnaround | < 10 minutes for typical PR | From `/code-review:code-review` invocation to consolidated output |
| Executor agents | 1 per parallel task, no cap | Maximize parallelism across non-overlapping tasks |
| Token budget guidance | Prefer Codex/gpt-5.4 for execution; reserve Opus for planning and complex analysis | No hard token limit; monitor and adjust |
| Review coverage | All changed files reviewed by at least one domain agent | Uncategorized files default to the architecture domain |
