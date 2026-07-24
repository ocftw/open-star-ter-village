# CLAUDE.md

This file provides Claude Code-specific guidance for working in this repository.
Shared project context belongs in the public docs:

- Root project overview and package layout: `README.md`
- Web app architecture, commands, and coding constraints: `packages/webapp/README.md`
- Homepage commands and content workflow: `homepage/README.md`
- Pull request process and evidence requirements: `CONTRIBUTING.md` and
  `.github/pull_request_template.md`

Read those files first when you need project structure, business context, runtime
configuration, or implementation constraints.

## Git Workflow

Always work in a worktree. When starting any task that involves code changes, create an isolated worktree first before making edits.

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
              3. pnpm webapp test (or pnpm homepage lint)
            → Auto-fix all critical issues
              (escalate to human only for: architecture conflicts, strategy gaps, unclear scope)
              → Commit → Push → Open draft MR with evidence
```

### Scope hierarchy

| Level | Owner | Description |
|-------|-------|-------------|
| **RFC** | Planner | Large feature area (e.g. "Create a game lobby") |
| **Plan** | Planner → Supervisor | One observable feature (e.g. "User can list public rooms") |
| **Task** | Supervisor → Executor | Single coding unit — implement + test, one agent handles end-to-end |

See [GitHub issue #365](https://github.com/ocftw/open-star-ter-village/issues/365)
for the archived workflow proposal and current discussion.

## Pull Requests

Before creating or updating a pull request, read `CONTRIBUTING.md` and
`.github/pull_request_template.md`. Open it as a draft until every material
claim has durable evidence in the PR body and required CI passes. Never mark a
PR ready based on unexecuted or inferred verification. After material commits or
evidence changes, update the PR body and re-request Copilot review. Resolve every
human and Copilot review conversation before merge.

## Agent Skills

Project-owned skills live with the project they operate on. From the repository
root, use:

- Webapp deploy smoke test:
  `packages/webapp/skills/webapp-deploy-smoke-test/SKILL.md`

From `packages/webapp/`, use:

- Webapp deploy smoke test:
  `skills/webapp-deploy-smoke-test/SKILL.md`
