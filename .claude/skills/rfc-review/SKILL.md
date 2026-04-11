---
name: rfc-review
description: RFC review lifecycle workflow for this project. Use this skill whenever the user asks to review an RFC, start the RFC review process, or move an RFC from Draft to Accepted. Guides Claude through: set status to In Review → Opus review → clarification loop with human → PR + approval → set status to Accepted. Invoke proactively when any RFC file is mentioned in a review context.
user-invocable: true
---

# RFC Review Workflow

Covers the full lifecycle from Draft to Accepted. Scripts handle the deterministic steps (status transitions, progress file creation). The Opus review and human clarification loop are the core of the process.

## Scripts

| Script | Usage | Purpose |
|--------|-------|---------|
| `scripts/set-status.sh` | `bash set-status.sh <rfc-file> <status>` | Update **Status:** field, commit, push |
| `scripts/save-review-summary.sh` | `echo "<content>" \| bash save-review-summary.sh <nnn>` | Write dated progress file |

Run scripts from the repo root. Valid status values: `Draft`, `In Review`, `Accepted`, `In Progress`, `Complete`, `Abandoned`.

## Workflow

### 1. Set Status → In Review

```bash
bash .claude/skills/rfc-review/scripts/set-status.sh <rfc-file> "In Review"
```

Use a cheap model agent (Codex or Haiku) for this step — it is a mechanical edit.

### 2. Review (Opus)

Spawn an Opus agent with high thinking effort. Provide the full RFC content.

Focus: **Critical Concerns only** — things that would cause the process or feature to fail, block implementation, or create lasting confusion.

Expected output format:
```
## Critical Concerns
<numbered list, or "None">

## Minor Notes
<numbered list, or "None">

## Verdict
<Ready to accept / Needs changes>
```

### 3. Clarification Loop

Present findings to the human. For each **Critical Concern**:

1. Ask the human how they want to resolve it (one concern at a time)
2. Apply the resolution to the RFC file
3. Run `/simplify` on the changed RFC
4. Re-run the Opus review to verify the concern is resolved

Repeat until the Opus review returns no Critical Concerns.

Minor Notes may be addressed at the human's discretion — do not block on them.

### 4. PR + Save Summary + Wait for Approval

Once no Critical Concerns remain:

1. Create a PR: `gh pr create` (makes the review visible on GitHub)
2. Save the review summary:
   ```bash
   echo "<review content>" | bash .claude/skills/rfc-review/scripts/save-review-summary.sh <nnn>
   ```
3. Ask the human explicitly: **"Do you approve this RFC?"**

Do not proceed to step 5 until the human says yes.

### 5. Set Status → Accepted

```bash
bash .claude/skills/rfc-review/scripts/set-status.sh <rfc-file> "Accepted"
```

Use a cheap model agent (Codex or Haiku) for this step.
