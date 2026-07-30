---
name: open-star-feedback-triage
description: Convert Open StarTer Village playtest feedback, screenshots, bug reports, and UX observations into deduplicated GitHub tracking items with stable identifiers, reproducible evidence, parent-thread indexing, sub-issues, and lifecycle updates. Use when the user submits gameplay feedback or asks to organize, classify, move, update, minimize, or close feedback in a project issue.
---

# Open Star Feedback Triage

Maintain a trustworthy project feedback ledger without prematurely turning every
observation into an implementation decision.

## Inspect the tracker first

1. Resolve the parent feedback issue and read its body, comments, linked
   sub-issues, pull requests, and current identifier scheme.
2. Search open and closed issues and merged pull requests for the same behavior.
3. Preserve existing identifiers and numbering. Never reuse or silently
   renumber an identifier.
4. Determine whether the parent distinguishes categories such as:
   - `B`: reproducible bug or incorrect game behavior;
   - `F`: usability, presentation, or product feedback.
5. Follow the parent tracker when its convention differs.

## Normalize each report

Inspect every supplied screenshot or recording and retain the reporter's
original meaning. Record:

- stable identifier and concise title;
- category and verification state;
- observed behavior;
- expected behavior or user need;
- reproduction steps, game mode, role, turn or phase, device, and viewport when
  known;
- visible evidence and its source;
- user impact and frequency;
- suspected duplicate or related item; and
- missing information needed to verify it.

Do not invent details hidden by a screenshot. Mark the report `Unverified` when
the behavior has not been reproduced or confirmed from code and evidence.

## Classify without overcommitting

Use one of these outcomes:

- **Duplicate**: link the canonical item and add genuinely new evidence there.
- **Needs clarification**: keep it in the parent tracker with a focused question.
- **Tracked feedback**: keep a bounded UX or product observation in the parent.
- **Sub-issue**: promote independently actionable work with its own acceptance
  criteria, owner, or implementation lifecycle.
- **Resolved**: link the merged fix and verification evidence.
- **Deferred or out of scope**: record the reason and any reconsideration trigger.

A proposed solution from the report is context, not a requirement. Separate the
underlying problem from implementation suggestions.

## Maintain GitHub state

When the user has asked to update the tracker:

1. Add or update the canonical parent comment for the item.
2. Create a sub-issue only after deduplication and classification.
3. Link the child to the parent using GitHub's sub-issue relationship when
   available; otherwise maintain an explicit link in both places.
4. Keep a parent index with identifier, title, classification, status, and
   canonical link.
5. Edit the canonical item instead of posting a chain of corrective comments.
6. Preserve screenshot links and credit; never expose unrelated private content
   visible elsewhere in an image.

If the user only asks for analysis, draft the proposed GitHub changes and stop
before mutating external state.

## Define actionable sub-issues

Each child issue should contain:

- problem statement;
- observed and expected behavior;
- reproduction context and evidence;
- acceptance criteria stated as observable outcomes;
- relevant dependencies or related items; and
- known limitations or open questions.

Avoid prescribing architecture unless the feedback itself requires a durable
design decision.

## Resolve and archive cleanly

Before marking an item resolved:

1. Verify that the linked pull request actually addresses its acceptance
   criteria.
2. Record whether the fix is merged, deployed, and playtest-verified; do not
   collapse these states into one.
3. Update the parent index and canonical item.
4. Minimize stale parent comments only after their content is represented by the
   canonical issue or resolved record.
5. Close child issues only when the project's chosen completion state has been
   reached.

End each triage pass with counts for new, duplicate, clarified, promoted,
resolved, deferred, and still-unverified items.
