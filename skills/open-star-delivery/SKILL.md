---
name: open-star-delivery
description: Deliver an Open StarTer Village GitHub issue, plan, branch, or pull request through implementation, durable evidence, validated review, CI, merge, deployment verification, issue updates, and worktree cleanup. Use when the user asks to deliver, finish, ship, merge and deploy, babysit, or follow an Open StarTer change through to a stated terminal condition.
---

# Open Star Delivery

Take ownership of the requested delivery outcome while preserving the user's
authority over production and forge mutations.

## Establish the delivery contract

1. Resolve the issue, plan, branch, or pull request and read all linked work.
2. Read `AGENTS.md`, the relevant project README, `CONTRIBUTING.md`, and
   `.github/pull_request_template.md`.
3. State the requested terminal condition:
   - implementation complete;
   - pull request ready;
   - merged;
   - deployed and smoke-tested; or
   - related issues closed and worktree removed.
4. Do not extend the terminal condition. In particular, do not merge or deploy
   unless the user's request includes that outcome.
5. Record the affected project, acceptance criteria, current branch or pull
   request head, dependencies, and known blockers.

## Prepare isolated work

- Reuse the task's existing worktree when it is clean and correctly scoped.
- Otherwise create a project worktree and branch before editing. Do not create a
  nested worktree.
- Fetch the latest remote state and rebase or merge the intended base according
  to the repository's current convention.
- Inspect the worktree before editing and preserve unrelated user changes.
- Keep commits small, focused, and compliant with the repository convention.

## Complete the implementation

1. Compare the current implementation with every acceptance criterion and linked
   review comment.
2. Implement only the missing behavior.
3. Add or update automated coverage for the changed behavior.
4. Run the validation required by the nearest `AGENTS.md`.
5. Simplify redundant code without trading away readability.
6. Report any criterion that remains deferred, untested, or blocked.

## Build durable evidence

- Map every material claim and changed surface to a real exercised scenario.
- Collect the evidence required by `CONTRIBUTING.md`; never infer evidence from
  source code or an unexecuted command.
- Use durable GitHub-hosted or repository-hosted artifacts. Do not use a local
  path, localhost URL, expiring artifact, or temporary preview as the only proof.
- Keep the pull request evidence table synchronized after scope or behavior
  changes.
- Open or keep the pull request as draft until evidence and required CI are
  complete.

## Review and converge

1. Review the complete diff with independent correctness and simplification
   lenses.
2. Treat findings as hypotheses. Reproduce defects, search all callers, or run
   focused experiments before presenting them as valid.
3. Give each valid finding the smallest fix and a concrete test method.
4. Apply only the fixes authorized by the user or required by the requested
   delivery outcome.
5. Re-run affected checks, update evidence, push, and re-request Copilot review
   after material changes.
6. Resolve every human and Copilot conversation before merge.
7. Re-review the delta after new commits rather than repeating stale findings.

## Merge safely

Before merging, confirm all of the following against the latest head:

- acceptance criteria are complete or explicitly deferred;
- required CI is green;
- durable evidence is complete;
- the pull request is ready, mergeable, and based on the intended base;
- review conversations are resolved; and
- risks and limitations are disclosed.

Do not bypass protections, dismiss unresolved review, or claim a queued merge
has completed. Use the repository's preferred merge strategy and verify the
resulting merge commit.

## Verify deployment

If deployment is part of the delivery contract:

1. Identify the deployment created from the merged revision.
2. Monitor the actual workflow and provider state to a terminal result.
3. For webapp changes, use
   `../../packages/webapp/skills/webapp-deploy-smoke-test/SKILL.md`.
4. For homepage changes, run the current homepage production checks documented
   by that project.
5. Record the deployed revision, environment, timestamp, checks performed, and
   any untested limitation.
6. If production is unhealthy, stop the delivery flow and use
   `../../packages/webapp/skills/webapp-incident-response/SKILL.md` when
   applicable.

A merge is not proof of deployment, and a successful deployment job is not
proof that the user-facing behavior works.

## Close the loop

- Update the parent issue and affected sub-issues with the pull request,
  deployed revision, evidence, deferred work, and final status.
- Close an issue only when its acceptance criteria are satisfied at the
  requested terminal condition.
- Remove the task worktree and branch only after the work is merged and no
  uncommitted work remains.
- Finish with a compact report of implementation, evidence, CI, review, merge,
  deployment, issue state, cleanup, and remaining risks.
