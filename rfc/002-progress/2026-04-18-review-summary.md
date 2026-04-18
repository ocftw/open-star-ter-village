## RFC 002 Revision Plan: Two-Layer Agent + Skill Design

### Problem

Opus review identified three Critical Concerns in the current RFC:

1. **CC1** — Role boundaries are convention-only; no detection or enforcement mechanism
2. **CC2** — `code-review` skill description was inaccurate (labeled "future deliverable")
3. **CC3** — `Plans → Tasks` decomposition assigned to Supervisor (Sonnet), but requires Opus-class architectural judgment

### Design: Two Layers

**Agents** define identity, scope, and model. **Skills** are human-invocable workflow steps that orchestrate agents.

```
Human invokes skill → skill decides which agents, how many, in what order
                    → agents execute within their allowed-tools scope
```

`plan-supervisor` is not a separate agent — supervision is what the `/implement` skill does internally.

---

### Layer 1: Agents

| Agent | `allowed-tools` scope | Claude preferred | Claude-only | GPT-only |
|-------|----------------------|-----------------|-------------|----------|
| `rfc-writer` | `Edit(rfc/**) Write(rfc/**) Bash(gh pr view:*) Bash(git *)` | Opus 4.6 | Sonnet 4.6 | gpt-5.4 effort:high |
| `programmer` | `Edit(packages/webapp/src/**) Edit(homepage/**) Bash(yarn *) Bash(git add:*) Bash(git commit:*) Bash(git push:*)` | Sonnet 4.6 | Sonnet 4.6 | gpt-5.3-codex |
| `code-reviewer` | read-only + `Bash(gh pr diff:*) Bash(yarn *) Bash(npx tsc:*)` | Sonnet 4.6 | Sonnet 4.6 | gpt-5.4 |

### Layer 2: Skills

| Skill | Spawns | Purpose |
|-------|--------|---------|
| `/rfc:write` | 1× `rfc-writer` | Draft a new RFC |
| `/rfc:to-plan` | 1× `rfc-writer` | Break accepted RFC into observable plans |
| `/plan:to-task` | 1× `rfc-writer` | Break a plan into parallelizable tasks |
| `/implement` | N× `programmer` | Spawn one per task; Codex review gate; `/simplify`; coordinate post-plan review |
| `/code-review` | N× `code-reviewer` | Scope-aware review orchestrator |
