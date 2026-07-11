# Contributing

Thank you for contributing to Open StarTer Village. These rules apply to human
contributors and AI agents alike.

## Development workflow

1. Discuss large or cross-cutting changes in an issue, discussion, or RFC first.
2. Keep the implementation focused and add or update the relevant automated
   tests.
3. Open a draft pull request while implementation or evidence collection is in
   progress.
4. Use `.github/pull_request_template.md` as the pull request body and keep the
   body current as the change evolves.
5. Collect evidence for every material claim or changed surface.
6. Mark the pull request ready only after its body is complete and the required
   CI and evidence checks pass.
7. Resolve every human and Copilot review conversation before merge.

## Commit messages

Use Conventional Commits:

```text
<type>(<optional scope>): <short description>
```

- Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`,
  and `perf`.
- Keep the subject under 72 characters and use imperative mood.
- Keep each commit focused on one small change.

## Baseline CI versus change evidence

Required CI owns routine validation. Depending on the affected project, it runs
the webapp lint, type-check, Jest, build, and Playwright suites or the homepage
lint and build. Do not copy routine CI logs into the pull request body.

Change evidence has a different purpose: it demonstrates that the changed
surface works in a realistic scenario. Passing unit or integration tests does
not replace this evidence, and screenshots do not replace CI.

## Evidence required for review

A ready pull request must map every material claim, visible outcome, regression
risk, or acceptance criterion to evidence in the pull request body's evidence
table. Closely related minor changes may share one scenario.

Use evidence appropriate to the change:

| Change type | Expected evidence |
| --- | --- |
| UI or layout | Screenshots or a short video of the changed states, including viewport or device context. Include before and after when the old and new states are meaningfully comparable. |
| API or server behavior | The exercised request, status and relevant response, or equivalent client/server trace with secrets removed. |
| New component | The component rendered in its real parent flow, including an important interaction or edge state; a source-file screenshot is not evidence. |
| User workflow or integration | Reproducible smoke-test steps and the observed result. Multi-user behavior must use the real multi-user path when that is the claim. |
| Performance | A repeatable before-and-after measurement using the same environment and method. |
| Documentation, configuration, or internal refactor | A rendered preview, runtime/configuration result, or a concise explanation of why runtime evidence is not applicable. |

Evidence must describe what was actually exercised. Do not claim a route,
environment, device, role, or test result that was not observed.

### Before and after

Provide matched before-and-after evidence when changing an existing visual or
measurable behavior. After-only evidence is acceptable for genuinely new
behavior; state that there was no comparable before state in the evidence row.

### Durable and canonical evidence

The pull request body is the canonical evidence record. Comments may contain
work-in-progress or supplementary material, but a ready pull request must link
or embed the final evidence in its body.

Use GitHub-hosted attachments or repository objects that will remain reachable
after merge. Local file paths, localhost URLs, terminal state, expiring CI
artifacts, and temporary preview deployments are not sufficient as the only
evidence. If an evidence-only branch is the sole host for an artifact, it must
not be deleted or pruned.

### Evidence not applicable

An author may select `Evidence not applicable` only when no changed surface can
be demonstrated meaningfully. The pull request body must contain a concrete
reason. The automated gate checks that the reason exists; reviewers decide
whether the exception is justified and may request evidence instead.

## Rules for AI agents

Before creating or updating a pull request, an AI agent must:

1. Read this file and `.github/pull_request_template.md`.
2. Open the pull request as a draft if evidence is incomplete.
3. Use the repository template, for example
   `gh pr create --draft --template .github/pull_request_template.md`, or
   reproduce the same structure when creating the pull request through an API.
4. Run the smoke scenario and collect the artifact before describing it as
   evidence. Never fabricate evidence or infer a passing result from code alone.
5. Put the complete evidence matrix and durable links in the pull request body,
   not only in a later comment.
6. Keep the body synchronized with scope changes and new commits.
7. Re-request Copilot review after material commits or evidence changes. Automatic
   review-on-push is intentionally disabled to limit cost and noise.
8. Mark the pull request ready only after the evidence gate and baseline CI pass.
9. Resolve every human and Copilot review conversation before merge.

## Reviewer gate

Reviewers should request changes when any of these conditions apply:

- A material claim or changed surface has no mapped evidence.
- The evidence does not exercise the claimed path or meaningful state.
- A comparable UI or measurable change omits before evidence without reason.
- Evidence is available only through a local or disposable location.
- An `Evidence not applicable` explanation is not credible for the change.
- Required CI is missing, bypassed, or failing.
- A human or Copilot review conversation remains unresolved.

The automated evidence check is intentionally structural. A passing check means
the required sections were completed; it does not certify that the evidence is
truthful or sufficient.

Copilot evidence review is advisory and may identify semantic gaps that the
structural check cannot. Authors must update the pull request body when evidence
changes, re-request Copilot review, and resolve all resulting conversations.
