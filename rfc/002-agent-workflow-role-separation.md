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

This RFC formalizes a two-layer agent + skill architecture: **agents** define identity, scope, and model; **skills** are human-invocable workflow steps that orchestrate agents. This replaces abstract role definitions with enforceable agent boundaries and composable workflow entry points.

## Goals

- Define three named agents (`rfc-writer`, `programmer`, `code-reviewer`) with scope-enforced boundaries via `allowed-tools`
- Support both Claude and GPT/Codex contributors — model assignments are recommendations, not requirements
- Define workflow skills (`/rfc:write`, `/rfc:to-plan`, `/plan:to-task`, `/implement`, `/code-review`) as human-invocable entry points
- Create a `/code-review` skill that determines review scope, spawns parallel domain-scoped reviewers, and consolidates findings as P0/P1/P2
- Support the monorepo structure — different review scopes for webapp vs homepage
- Enable maintainers and contributors to self-service review without consuming tokens via GitHub hooks

## Non-Goals

- Automating code review via GitHub Actions or webhooks (token cost risk from external triggers)
- Replacing human code review — this augments, not replaces, maintainer judgment
- Defining `.claude/settings.json` configuration (covered in RFC 003)
- Defining the RFC folder structure or template (covered by RFC 001)
- Domain-specific `code-reviewer` variants (e.g., `code-reviewer:game-core`, `code-reviewer:ui`) — these are future work

## Solutions

### 1. Two-Layer Architecture

This RFC defines two layers:

- **Agents** — named, scoped entities. Each agent has an `allowed-tools` definition that enforces what files and commands it can access, regardless of which model runs it.
- **Skills** — human-invocable workflow steps. Each skill orchestrates one or more agents to accomplish a workflow goal.

```
Human invokes skill
  ↓
Skill decides: which agents, how many, in what order or in parallel
  ↓
Agents execute within their allowed-tools scope
```

### 2. Agent Definitions

Three agents, each with a skill file defining scope and model recommendations:

| Agent | `allowed-tools` scope | Claude (preferred) | Claude-only | GPT-only |
|-------|----------------------|-------------------|-------------|----------|
| `rfc-writer` | `Edit(rfc/**) Write(rfc/**) Bash(gh pr view:*) Bash(gh pr diff:*) Bash(git *)` | Opus 4.6 | Sonnet 4.6 | gpt-5.4 effort:high |
| `programmer` | `Edit(packages/webapp/src/**) Edit(homepage/**) Write(packages/webapp/src/**) Write(homepage/**) Bash(yarn *) Bash(git add:*) Bash(git commit:*) Bash(git push:*)` | Sonnet 4.6 | Sonnet 4.6 | gpt-5.3-codex |
| `code-reviewer` | read-only — `Bash(gh pr diff:*) Bash(gh pr view:*) Bash(yarn *) Bash(npx tsc:*)` | Sonnet 4.6 | Sonnet 4.6 | gpt-5.4 |

> **Model suggestions are not requirements.** Agent identity is defined by which skill you invoke and its `allowed-tools` scope — not the model. Pick the column that matches your available tools. `rfc-writer` and `code-reviewer` are reasoning-heavy tasks; `programmer` is implementation work optimized for a code-specialized model.

**Agent boundaries are enforced by `allowed-tools`, not convention.** When a skill invokes an agent, Claude Code restricts available tools to those listed. Violations fail at the tool-call level. The `allowed-tools` mechanism is the same used by the `playwright-cli` skill (`allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)`).

### 3. Skill Definitions

Skills are human-invocable entry points. Each skill orchestrates one or more agents.

| Skill | Spawns | Purpose |
|-------|--------|---------|
| `/rfc:write` | 1× `rfc-writer` | Draft a new RFC from a prompt |
| `/rfc:to-plan` | 1× `rfc-writer` | Break an accepted RFC into observable plans |
| `/plan:to-task` | 1× `rfc-writer` | Break a plan into parallelizable tasks |
| `/implement` | N× `programmer` | Spawn one per task, run Codex review gate, `/simplify`, coordinate post-plan review |
| `/code-review` | N× `code-reviewer` | Scope-aware review orchestrator (see §5) |

### 4. Development Process

```
/rfc:write      → rfc-writer drafts RFC
/rfc:to-plan    → rfc-writer breaks RFC into plans (one observable feature each)
/plan:to-task   → rfc-writer breaks plan into parallelizable tasks
/implement      → N× programmer agents (one per non-overlapping task)
                    [Codex review gate — auto-reviews each commit]
                  → /simplify per task (post-task cleanup)
                  → post-plan review in parallel:
                      /codex:review
                      /codex:adversarial-review (code-reviewer perspective)
                      yarn webapp test (or homepage lint)
                  → programmer agents auto-fix critical findings
                    (escalate only: architecture conflicts, unclear scope)
                  → commit → push → raise PR
/code-review    → N× code-reviewer agents (one per affected domain)
                  → consolidated P0/P1/P2 findings
```

**Process notes:**

- **RFC → Plans:** `rfc-writer` breaks a large RFC into plans — each plan is one observable feature verifiable end-to-end (e.g., "User can list public rooms").
- **Plans → Tasks:** `rfc-writer` (Opus/gpt-5.4) breaks each plan into tasks — the smallest coding unit a `programmer` can complete independently: implement + test + validate. Task decomposition requires architectural judgment about dependencies and parallelism — this belongs with the highest-capability model available, not with a coordination layer.
- **Parallel implementation:** `/implement` spawns 1–N `programmer` agents in parallel, one per non-overlapping task. No cap on `programmer` agents — maximize parallelism.
- **Codex review gate:** enabled during implementation so each commit is auto-reviewed as it lands. Catches issues early before post-plan review.
- **Post-plan review:** `/codex:review` and `/codex:adversarial-review` run in parallel with automated tests. The `code-reviewer` perspective in `/codex:adversarial-review` challenges correctness, safety, and architectural fit.
- **Scope enforcement:** `/implement` runs `git diff --name-only HEAD~1` after each `programmer` task and cross-references changed files against the task's declared domain. Out-of-scope files are flagged before push.

**`programmer` agent cap:** No cap — one per non-overlapping task.
**`code-reviewer` agent cap:** One per affected domain (domain count, not file count).

### 5. `/code-review` Skill

A Claude Code skill that maintainers and contributors invoke manually. **Not attached to GitHub hooks or actions.** It wraps `/codex:review` and `/codex:adversarial-review`, determines review scope, and consolidates findings.

**Skill behavior:**

```
Step 1 — Clarify target
  → uncommitted code  (git diff --staged)
  → branch            (git diff main..HEAD)
  → PR by number      (gh pr diff <number>)
  → PR by URL         (gh pr diff <URL>)

Step 2 — Determine scope → spawn parallel code-reviewer agents
  webapp changes:
    → /codex:review              (game logic perspective)
    → /codex:review              (UI perspective)
    → /codex:adversarial-review  (architecture perspective)
  homepage changes:
    → /codex:review              (content + styling perspective)
  cross-project / monorepo config:
    → add one infra perspective

Step 3 — Consolidate findings
  P0 — Critical: must fix before merge
  P1 — Important: should fix
  P2 — Nice to have: optional improvements
```

The `code-reviewer` agent is generic — the domain perspective is passed as context per invocation. No separate agent definition per domain. Domain-specific `code-reviewer` variants are out of scope for this RFC.

### 6. Code Review Output Format

All review agents produce findings in this structure:

```markdown
## [Domain] Review

### P0 — Critical
Must fix before merge.
- `file/path.ts:42` — Description of the issue

### P1 — Important
Should fix.
- `file/path.ts:78` — Description of the concern

### P2 — Nice to Have
Optional improvements.
- `file/path.ts:15` — Suggestion

### Verification
- [ ] `yarn webapp build` — pass/fail
- [ ] `yarn webapp test` — pass/fail
- [ ] `npx tsc --noEmit` — pass/fail
```

When multiple agents run in parallel, `/code-review` consolidates their findings into a single P0/P1/P2 summary.

### 7. Project-Aware Review Scope

The number of `code-reviewer` agents spawned by `/code-review` adapts to the project and change scope.

**Webapp review domains:**

| Domain | Perspective | Files |
|--------|-------------|-------|
| Game Logic | Moves, handlers, state mutations, rules, tests | `src/game/**` |
| Architecture | Types, state management, build config, server, dependencies | `src/server.ts`, `src/lib/**`, `tsconfig*.json`, `package.json` |
| UI | Components, props, hooks, accessibility, styles | `src/components/**`, `src/pages/**` |

**Homepage review domains:**

| Domain | Perspective | Files |
|--------|-------------|-------|
| Content & Styling | Card data, page content, footer, CMS config, components, CSS, i18n | `_cards/`, `_pages/`, `_footer/`, `src/CMS/`, `src/components/`, `public/css/` |

**Decision rule:** Count affected domains, not files. A 50-file change in one domain = 1 agent. A 10-file change across 3 domains = 3 agents.

### 8. Agent Scope Enforcement

**Primary enforcement — `allowed-tools` frontmatter:**

Each agent's skill file defines its tool scope via `allowed-tools`. Claude Code restricts available tools to those listed when a skill is active. See §2 for the full `allowed-tools` definitions per agent.

**Secondary enforcement — post-commit scope check:**

`/implement` runs `git diff --name-only HEAD~1` after each `programmer` task and cross-references changed files against the task's declared domain. Out-of-scope files are flagged before push. This is detection, not prevention — `allowed-tools` is the primary prevention.

**Relation to RFC 003:**

`settings.json` (RFC 003) defines the union baseline and the deny list that applies across all agents (protected branches, destructive operations). Skill `allowed-tools` scopes each invocation to a subset of those permissions.

> These boundaries are enforced by tooling (`allowed-tools`), not by convention. There is no "future work" qualifier — the mechanism exists today, as demonstrated by the `playwright-cli` skill.

### 9. AGENTS.md

Replace the current generic `AGENTS.md` (254 lines) with a ~10-line pointer:

```markdown
# AGENTS.md

You are a `programmer` agent. Read `.claude/skills/programmer/SKILL.md` for your full instructions.

Summary: implement scoped tasks, run validation before reporting, follow Conventional Commits, stay within your declared domain.
```

All executor-specific content (task intake format, implementation rules, commit convention, validation checklist, reporting format) moves to `.claude/skills/programmer/SKILL.md`.

## Rejected Solutions

### Fixed 3-domain agent pattern
Always using 3 agents (game logic, architecture, UI). Rejected because: (a) the homepage project doesn't have game logic, (b) small changes don't warrant 3 agents, (c) token cost scales linearly with agent count. The project-aware strategy is more flexible and cost-effective.

### Single-agent review
Using one agent for all review work. Rejected because: PR #335 demonstrated that parallel domain-scoped agents catch more issues than a single pass.

### GitHub Action–triggered review
Attaching review to a GitHub Action on PR events. Rejected because: any external actor can open a PR, consuming tokens uncontrollably. Manual invocation keeps token spend intentional.

### Claude-only workflow (no Codex)
Using Claude for both planning and execution. Rejected because: Opus tokens are significantly more expensive for implementation tasks. Delegating to Codex or Sonnet reduces cost while maintaining quality.

### `/code-review:code-review` in the post-plan loop
Running `/code-review:code-review` as a post-plan review step alongside `/codex:review`. Rejected because: it duplicates Codex review at higher cost. `/codex:review` and `/codex:adversarial-review` cover the same ground; `/code-review` is retained as a standalone human-invocable skill, not a loop step.

### Supervisor-led task decomposition
Assigning `Plans → Tasks` to a Supervisor (Sonnet-class). Rejected because: task decomposition requires architectural judgment about dependency ordering and parallelism — this is reasoning work that belongs with the highest-capability model available (`rfc-writer` / Opus or gpt-5.4). Mis-scoped tasks from a weaker model cause executor failures that negate the token savings.

### Role-based boundaries (convention-enforced)
Defining Planner/Supervisor/Executor roles enforced by documentation and prompts. Rejected because: any agent can deviate without detection. `allowed-tools` frontmatter enforces scope at the tool-call level — violations fail rather than being silently ignored.

### Fixed model assignments (model as identity)
Tying agent identity to a specific model (e.g., "the Planner must use Opus"). Rejected because: contributors have different tool access (Claude-only, GPT-only, or both). Agent identity is defined by the skill's `allowed-tools` scope; model is a recommendation with explicit fallbacks.

## Testing Plan

1. **Agent scope check:** Invoke the `programmer` skill and attempt to edit `rfc/002.md` — verify the tool call is rejected by `allowed-tools`.

2. **Post-commit scope detection:** Run `/implement` on a task declared for `src/game/**`. Have a `programmer` agent touch `src/components/`. Verify `/implement` flags the out-of-scope file before push.

3. **`/code-review` — branch review:** Create a test branch with webapp changes across multiple domains. Invoke `/code-review` and verify it:
   - Correctly identifies the target as a branch diff
   - Spawns one `code-reviewer` per affected domain
   - Produces consolidated P0/P1/P2 output

4. **`/code-review` — PR review:** Run `/code-review` on PR #335 (by number and by URL) and verify it fetches the PR diff correctly.

5. **`/code-review` — homepage:** Create a test branch with homepage content changes. Verify it spawns 1 agent (content + styling combined).

6. **AGENTS.md pointer:** Have a `programmer` agent read the new AGENTS.md and confirm it correctly redirects to `.claude/skills/programmer/SKILL.md`.

7. **No regressions:** Run `yarn webapp build` and `yarn webapp test` to confirm doc-only changes don't break anything.

## SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| Review turnaround | < 10 minutes for typical PR | From `/code-review` invocation to consolidated P0/P1/P2 output |
| `programmer` agents | 1 per non-overlapping task, no cap | Maximize parallelism |
| `code-reviewer` agents | 1 per affected domain | Domain count drives agent count, not file count |
| Token budget guidance | Use suggested model when available; fall back per §2 model matrix | No hard token limit; monitor and adjust |
| Review coverage | All changed files reviewed by at least one domain agent | Uncategorized files default to the architecture domain |
