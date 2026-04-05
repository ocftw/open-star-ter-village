# RFC 003: Permissions for Hands-Free Execution

**Status:** Draft
**Author:** @ben196888
**Created:** 2026-03-23
**Related:** [Issue #346](https://github.com/ocftw/open-star-ter-village/issues/346), [RFC 002](./002-agent-workflow-role-separation.md)

## Description

During automated agent workflows (RFC 002), every file edit, git command, and agent spawn triggers an approval prompt in Claude Code. This friction breaks hands-free execution and forces human babysitting of routine operations.

This RFC documents the permissions needed for each agent role to operate with minimal prompts, configures them in `.claude/settings.json`, and defines safety rails to prevent destructive operations.

## Goals

- Document all permissions needed by each role (Planner, Supervisor, Executor)
- Configure `.claude/settings.json` with the union of role permissions (project-level, committable)
- Define an explicit deny list for destructive operations on protected branches
- Allow force push on non-protected (feature) branches
- Provide a clear separation between project settings (shared) and local settings (personal)

## Non-Goals

- Per-role permission enforcement at the tooling level (not supported — see RFC 002, section 7)
- GitHub branch protection rules (managed in GitHub repo settings, not in code)
- Codex CLI permission configuration (Codex uses `--full-auto` mode with its own safety model)
- CI/CD pipeline permissions (managed in GitHub Actions, not in Claude Code)

## Solutions

### 1. File Operation Permissions

Scoped by project and purpose:

| Permission | Role Intent | Reason |
|------------|-------------|--------|
| `Edit/Write(rfc/**)` | Planner, Supervisor | Create and update RFCs and progress files |
| `Edit/Write(.claude/commands/**)` | Planner | Create and update skills |
| `Edit/Write(packages/webapp/src/**)` | Executor | Webapp source code |
| `Edit/Write(homepage/src/**)` | Executor | Homepage source code |
| `Edit/Write(homepage/_cards/**)` | Executor | Homepage card content |
| `Edit/Write(homepage/_pages/**)` | Executor | Homepage page content |
| `Edit/Write(homepage/_footer/**)` | Executor | Homepage footer content |

### 2. Shell Command Permissions

#### Build & Validation
| Permission | Role Intent | Reason |
|------------|-------------|--------|
| `yarn webapp build` | Supervisor, Executor | Build verification |
| `yarn webapp test` | Supervisor, Executor | Test verification |
| `yarn webapp lint` | Supervisor, Executor | Lint check |
| `npx tsc:*` | Supervisor, Executor | Type checking |
| `cd homepage && yarn lint` | Supervisor, Executor | Homepage lint |
| `cd homepage && yarn build` | Supervisor, Executor | Homepage build |

#### Git Operations
| Permission | Role Intent | Reason |
|------------|-------------|--------|
| `git add:*` | All | Stage changes |
| `git commit:*` | All | Create commits |
| `git status:*` | All | Check working tree |
| `git diff:*` | All | View changes |
| `git log:*` | All | View history |
| `git push origin:*` | All | Push feature branches |
| `git branch:*` | All | Branch management |

#### GitHub CLI
| Permission | Role Intent | Reason |
|------------|-------------|--------|
| `gh pr comment:*` | Supervisor | Post review findings |
| `gh pr create:*` | Supervisor | Create pull requests |
| `gh pr edit:*` | Supervisor | Update PR metadata |
| `gh pr view:*` | Planner, Supervisor | Read PR context |
| `gh pr diff:*` | Planner, Supervisor | Read PR changes |
| `gh issue comment:*` | Supervisor | Comment on issues |

### 3. Deny List (Safety Rails)

These operations are **always denied** regardless of role:

| Denied Permission | Reason |
|-------------------|--------|
| `git push origin main:*` | Never push directly to main |
| `git push origin master:*` | Never push directly to master |
| `git push --force origin main:*` | Never force push to main |
| `git push --force origin master:*` | Never force push to master |
| `git reset --hard:*` | Destructive — loses uncommitted work |
| `rm -rf:*` | Destructive — irreversible file deletion |

**Note:** `git push --force` on feature branches is **allowed**. This enables interactive rebase workflows and fixup/squash commits on in-progress branches.

### 4. Settings File Separation

| File | Scope | Git | Contents |
|------|-------|-----|----------|
| `.claude/settings.json` | Project | Committed | Shared permissions (union of all roles) |
| `.claude/settings.local.json` | Personal | Gitignored | User-specific overrides (MCP servers, personal tools) |

Settings load in order: user → project → local. Later files override earlier ones. The project `settings.json` is the canonical reference for agent permissions.

### 5. Current Configuration

The current `.claude/settings.json` implements sections 1–3 above. See the file for the exact permission list.

## Rejected Solutions

### Per-agent permission files
Claude Code does not support scoping permissions per agent or per role. All agents in a session share the same permission set from `settings.json`.

### GitHub Action-based permission enforcement
Adding a CI step to validate that agents didn't exceed their role permissions. Rejected because: adds CI complexity and token cost, and the enforcement happens after the fact rather than preventing the action.

### Blanket `git push --force` deny
The original issue proposed denying all force pushes. Rejected because: force push on feature branches is a legitimate workflow for interactive rebase and fixup commits. Only force push to protected branches (main/master) is denied.

### `dontAsk` permission mode
Setting `defaultMode: "dontAsk"` to skip all prompts. Rejected because: this bypasses ALL permission checks including the deny list, which is too permissive. Explicit allow/deny lists are safer.

## Testing Plan

1. **JSON validation:** Run `jq . .claude/settings.json` — must exit 0
2. **Allow list verification:** In a Claude Code session, run an allowed command (e.g., `git status`) — should not prompt
3. **Deny list verification:** Attempt `git push origin main` — should be blocked
4. **Force push on feature branch:** Run `git push --force origin <feature-branch>` — should be allowed
5. **File edit scope:** Edit a file in `packages/webapp/src/` — should not prompt. Edit a file outside allowed paths — should prompt.

## SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| Permission review | Within same PR as the feature using them | No standalone permission PRs without justification |
| Deny list changes | Require maintainer approval | Safety-critical — cannot be self-approved |
