# RFC 001: RFC Infrastructure

**Status:** In Review
**Author:** @ben196888
**Created:** 2026-03-23
**Related:** [Issue #346](https://github.com/ocftw/open-star-ter-village/issues/346)

## Description

The project lacks a standardized process for proposing and tracking technical decisions. Specs have lived ad-hoc in various locations (or not at all), making it difficult to understand why decisions were made, what alternatives were considered, and what the implementation status is.

This RFC bootstraps the RFC process itself: folder structure, naming conventions, template, lifecycle states, and progress tracking.

## Goals

- Establish `rfc/` as the canonical location for project RFCs
- Define a consistent RFC template (Title, Description, Goals, Non-Goals, Solutions, Rejected Solutions, Testing Plan, SLAs)
- Define lifecycle states for tracking RFC progress
- Provide a `rfc/NNN-progress/` convention for review summaries and implementation notes
- Migrate any existing specs into the new structure

## Non-Goals

- Enforcing RFC creation via CI checks or GitHub Actions
- Retroactively writing RFCs for past features or decisions
- Defining a formal governance process (voting, approval thresholds)

## Solutions

### 1. Folder Structure

```
rfc/
├── TEMPLATE.md                             # Reusable RFC template
├── 001-rfc-infrastructure.md               # This RFC
├── 001-progress/                           # Progress tracking for RFC 001
│   └── ...
├── 002-agent-workflow-role-separation.md   # Agent workflow RFC
├── 002-progress/                           # Progress tracking for RFC 002
│   └── ...
└── NNN-slug.md                             # Future RFCs
```

**Naming convention:** `NNN-kebab-case-slug.md` where NNN is a zero-padded sequential number.

**Progress folders:** `NNN-progress/` contains review summaries, implementation notes, and other tracking artifacts. Files inside are freeform — no required structure.

### 2. RFC Template

See `rfc/TEMPLATE.md` for the full template. Every RFC must include:

- **Metadata:** Status, Author, Created date, Related issues/PRs
- **Description:** The problem and motivation
- **Goals / Non-Goals:** Scope boundaries
- **Solutions:** The proposed approach, in detail
- **Rejected Solutions:** Alternatives considered and why they were rejected
- **Testing Plan:** How to verify the solution
- **SLAs:** Measurable targets where applicable

### 3. Lifecycle States

| State | Meaning | Who Transitions |
|-------|---------|-----------------|
| **Draft** | Initial proposal, open for feedback | Author |
| **In Review** | Formally submitted for team review | Author |
| **Accepted** | Approved for implementation | Maintainer |
| **In Progress** | Implementation underway | Author / Executor |
| **Complete** | Fully implemented and verified | Maintainer |

Transitions are tracked by updating the `Status` field in the RFC frontmatter. There is no formal approval vote — maintainer judgment applies.

### 4. Integration with Agent Workflow

RFCs serve as the primary input for the Planner role (see RFC 002). The development process starts with an RFC:

1. Planner drafts the RFC in `rfc/`
2. RFC is reviewed and accepted
3. Planner breaks the RFC into implementation tasks
4. Executors implement; progress tracked in `rfc/NNN-progress/`
5. RFC status updated to Complete when all tasks are done

### 5. CLAUDE.md Reference

Add a brief section to CLAUDE.md pointing agents to `rfc/` for feature specs and decision context.

## Rejected Solutions

### `docs/rfcs/` path
Extra directory nesting. `rfc/` at the repo root is more discoverable and conventional across open-source projects.

### Wiki-based RFCs
GitHub Wiki pages are not version-controlled alongside code, making them easy to lose sync. RFCs in `rfc/` are reviewed in the same PR as the implementation.

### GitHub Discussions as RFCs
Discussions lack structured lifecycle tracking, cannot be co-located with code, and are harder to reference from agent workflows.

### Notion / Google Docs
External tools introduce access management overhead and are not version-controlled. Contributors need a GitHub account, not a Notion account.

## Testing Plan

1. **Template usability:** Verify `TEMPLATE.md` can be copied to create a new RFC with all required sections
2. **Existing RFC conformance:** Verify RFC 002 (already committed) follows the template structure
3. **Progress folder:** Create `rfc/001-progress/` and verify it can hold freeform tracking files
4. **Agent discovery:** Verify that a Claude Code or Codex agent, given the instruction "read the relevant RFC", can find and parse RFCs in `rfc/`

## SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| RFC review turnaround | ≤ 1 week from Draft → In Review decision | Maintainer acknowledges within 1 week |
| RFC numbering | Sequential, no gaps | If an RFC is abandoned, its number is not reused |
