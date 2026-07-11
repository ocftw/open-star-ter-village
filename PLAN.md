# Homepage Dependency Upgrade (#394)

## Goal

Upgrade the homepage to the current stable frontend and CMS stack while
preserving public rendering, keeping Decap CMS available at `/admin/`, and
proving both local production and Netlify Deploy Preview behavior.

Issue: <https://github.com/ocftw/open-star-ter-village/issues/394>

## Delivery sequence

The work is split into two pull requests because GitHub cannot manually dispatch
a workflow until that workflow exists on the default branch.

### PR 1: visual-baseline workflow bootstrap

- Add a manually dispatched `Update visual baselines` workflow.
- Accept a same-repository branch as input and reject `main`, tags, protected
  branches, and fork refs.
- Check out the branch at its current SHA, use Node 24 and the pinned
  Playwright/Chromium toolchain, regenerate all 16 snapshots, and commit only
  changed baseline PNG files.
- Push `test(homepage): update visual baselines` as `github-actions[bot]`.
- Exit successfully without a commit when snapshots are unchanged.
- Never run during ordinary push or pull-request CI.

PR 1 must merge before PR 2 uses the workflow.

### PR 2: dependency upgrade and verification

#### Establish the pre-upgrade baseline

- Add homepage-local Playwright configuration and test scripts.
- Run the production build with `next start`, not the development server.
- Cover `/`, `/cards/`, `/resource/`, and a missing route in both the default
  and English locales.
- Capture full-page screenshots at `1440x900` and `390x844`, producing exactly
  16 baseline PNGs.
- Use `threshold: 0.2` and `maxDiffPixelRatio: 0.001`.
- Block Google Tag Manager during local tests, retain Netlify Identity, disable
  animation, and wait for fonts and images before capture.
- Verify `/admin/` renders the Decap CMS shell without uncaught runtime errors;
  authentication and content editing are out of scope.
- Trigger the merged PR 1 workflow before dependency changes and commit the
  generated pre-upgrade snapshots for review.
- Do not regenerate baselines merely to make the upgraded implementation pass.

#### Upgrade the active stack

- Use the stable package versions current at implementation time, pinned
  exactly in `homepage/package.json` and `homepage/yarn.lock`.
- Upgrade Next.js, React, React DOM, Decap CMS App, ESLint, Next.js ESLint
  config, Prettier integration, Playwright, and every other active direct
  dependency to compatible stable releases.
- Keep Yarn 3.4.1 for this issue.
- Add direct dependencies imported by active source, including `gray-matter`.
- Remove unused dependencies, including `remark` and `remark-html` when the
  active-source audit confirms they remain unused.
- Resolve peer warnings owned by the homepage manifest. Do not add overrides or
  dead packages merely to silence harmless upstream Decap CMS warnings.
- Remove `homepage/_legacy/`; do not restore its obsolete Gatsby dependencies.
- Make only compatibility changes required by the upgraded stack and preserve
  public behavior against the pre-upgrade snapshots.

#### Migrate linting

- Replace removed `next lint` usage with ESLint 10 flat configuration.
- Preserve the current warning-tolerant behavior; do not use
  `--max-warnings=0`.
- Keep Prettier checks and fix scripts available.

#### Document the upgrade

- Create `homepage/CHANGELOG.md` in Keep a Changelog style.
- Move all existing release history from `homepage/README.md` into the
  changelog, preserving its Traditional Chinese wording.
- Add an English `Unreleased` entry describing dependency changes, major-version
  behavior changes, removal of `_legacy/`, and evidence-backed deferrals.
- Keep the README focused on current setup, commands, and architecture.
- Do not mention or link the separate pnpm migration in this changelog.

#### Local production CI

- On Node 24, install dependencies immutably, lint, build, install pinned
  Chromium, and run Playwright against `next start`.
- Run visual comparisons with no retries.
- Retain the Playwright HTML report, expected/actual/diff images, and traces only
  on failure for seven days.
- Ordinary CI must never update snapshots.

#### Netlify Deploy Preview smoke suite

- Keep this suite separate from local visual tests and do not take remote
  screenshots.
- For same-repository PRs, poll the existing
  `netlify/openstartervillage/deploy-preview` status for up to 10 minutes,
  extract its target URL after success, and fail on deployment failure or
  timeout.
- Treat fork PRs without a preview as a successful not-applicable case.
- Exercise all eight public URLs plus `/admin/`.
- Require expected content, successful navigation, no uncaught page exception,
  no failed first-party resource, and a rendered Decap CMS shell.
- Record but do not fail on third-party console or network noise.
- Retry remote smoke failures twice with short backoff.
- Expose the suite as a distinct required PR check.

## Snapshot storage and maintenance

- Regenerate all 16 images together; do not select individual routes or
  viewports.
- Commit PNGs normally when the complete set is at most 25 MB.
- If the set exceeds 25 MB, adopt Git LFS and update CI checkout accordingly.
- The manual workflow may commit snapshots only after an explicit developer
  dispatch and may never target `main` or a protected branch.

## Validation

Run from `homepage/` on Node 24:

```bash
yarn install --immutable
yarn lint
yarn build
yarn test:visual
yarn test:admin
```

Also validate workflow syntax, run `git diff --check`, inspect all visual diffs,
and exercise the Netlify preview suite on the PR URL before marking PR 2 ready.

## Follow-up issue

Create a separate issue for migrating the entire repository from Yarn to pnpm.
The migration must cover root workspaces, the webapp, homepage, CI caching,
Netlify install behavior, lockfiles, and contributor documentation. It is not
part of #394.
