# UI/UX validation runbook

How to validate the visual and interaction quality of a game-room PR in a
repeatable way. It is written for lens/validator bots (Arachne first) and for
anyone repeating the same check by hand. The aim is that every repeated check
gets cheaper and eventually runs by itself in CI, so a lens run shrinks to the
judgement calls only a reviewer can make.

## The self-learning loop

Design: dexters-laboratory #14.

1. **Runbook** (this file). Every check follows a documented procedure that
   lives in the repo, not in a bot's memory.
2. **Script / skill.** The mechanical part (fixed viewports, seed, capture,
   store by SHA) becomes a script. A skill is added only where judgement steps
   need guidance.
3. **CI test.** Any finding with an objective answer becomes a test.

Rules that keep the loop honest:

- Findings move through a [ledger](#findings-ledger).
- The PR that fixes a **P1 or P2** finding also adds the test that catches it.
  At most one follow-up test PR per batch may cover remaining test plumbing
  (for example axe setup), so a fix is not blocked on that. Judgement-only
  findings do not require a test.
- If a finding originates in a plan (as with the #496 hidden-information
  leak), also add it to the plan cross-review checklist and the visual-plan
  skill. Hidden-information review still needs a human or model pass; plan-format
  lint does not catch it. (Those artifacts are not edited by this runbook.)
- Once CI enforces a check, **prune it from this runbook** and leave one line
  naming the test.
- Track recurrence (a repeat finding means a missed promotion) and lens-run
  cost per milestone (falling cost means the loop works).
- Taste (design fidelity, readability, feel) stays judgement-only. Do not force
  it into CI.

## When to run

- One judgement pass per final SHA, at the top of the stack. Rechecks cover
  only the changes.
- Non-visual PRs (docs, tests, `.github/**` only) do not need a visual
  validation.

## Target

In order of preference:

| # | Target | Notes |
| --- | --- | --- |
| 1 | Local production build: `pnpm webapp build` + start, with `ENABLE_DEV_ROUTE`, offline, `/dev?seed=e2e-2` | Default. The seed only works offline. |
| 2 | Staging `https://osv-pr-<n>.fly.dev/dev?seed=e2e-2` | For human inspection only, and only when a maintainer has added the `staging` label. Limits (idle stop loses in-memory matches, 256 MB, 4 h reaper, at most 5 apps): see [`packages/webapp/docs/pr-staging.md`](../packages/webapp/docs/pr-staging.md). |

Never use `?ga_preview=1`.

## Cost rules (tokens first)

Token cost comes before wall-clock time. Prefer a cheaper token path even when
it takes longer to run.

- The default target is the local production build. Staging is only for humans
  who want to look, and only when a maintainer has added the `staging` label.
  Do not send a lens bot to staging as the default path.
- The capture script runs headless, with no bot attached, and writes a compact
  summary (states captured, axe violation count, changed diffs). The bot reads
  that summary first.
- Open only the screenshots that changed, never the full matrix.
- Wait on CI with one blocking `gh pr checks --watch` call, then read only the
  failing job logs. Never poll staging URLs or the pipeline repeatedly.
- Every objective check moves into CI so the lens bot stops paying for it.
- One judgement pass per final SHA, at the top of the stack. Rechecks cover
  only the changes.

## Capture settings

Fixed viewport matrix:

| Viewport | Note |
| --- | --- |
| 1440x900 | |
| 1280x900 | |
| 1024x768 | |
| 768x1024 | |
| 390x844 | touch |
| 360x800 | |
| 320x640 | |

Always: DPR 1, reduced motion on, `animations: 'disabled'`, locale `zh-TW`,
fonts loaded (`await document.fonts.ready`).

## Named states

Each state is reached by a scripted journey with seed `e2e-2`.

| Id | State |
| --- | --- |
| S01 | round-start overlay R1 |
| S02 | board after 知道了 |
| S03 | action selected |
| S04 | 換人力 mode, × on tiles |
| S05 | after removal, before 確認人力 |
| S06 | after 確認人力 |
| S07 | project started |
| S08 | contribute |
| S09 | 四大自由 (`demo=four-freedoms`) |
| S10 | event dialog |
| S11 | round 3 (rotation) |
| S12 | menu open (mobile) |
| S13 | keyboard focus walk |
| S14 | game over |

Expected event order: 番茄醬工作法, 人力釋出, 四大自由, 斜槓青年, 青年補助,
是芥末日. **Capture must fail if the event order drifts**, because a drifted
seed means the states no longer mean the same thing.

## Artifact layout

```text
artifacts/ui/<full-sha>/<viewport>/<state-id>.png
artifacts/ui/<full-sha>/manifest.json
```

`manifest.json` records the SHA, target URL, browser and font versions, seed
and event order. Names are identical across SHAs so two runs can be diffed.

## Lenses

| Lens | Looks at |
| --- | --- |
| Layout | Overflow, clipping, sticky regions, hit areas across the matrix |
| Journey | The states above end to end, including keyboard and mobile menu |
| Health | Console errors, failed requests, runtime exceptions |
| Accessibility | axe, contrast ratios, focus order and rings, target size |
| Regression focus | Findings from earlier runs on the same area |
| Rules / state | Hidden information, whenever wireframes, UI, DOM, previews or animations can reveal it. Turn order and rotation, when the engine changes |

## Severity and verdict

Findings are labelled P0–P3.

- **Any P0, P1 or P2 means HOLD.** OPEN / PASS means no P0–P2 is left.
- Arachne also listed a BLOCK verdict, but no threshold was agreed, so this
  runbook does not use BLOCK yet.
- Pre-existing issues are noted but not counted.
- Grade **Quality** (A–F) and **Spec**. Spec has been null on OSV so far
  because no PR linked a spec issue.
- A flaw copied from the design still fails.
- One judgement pass per final SHA, at the top of the stack.

## What CI already covers

These tables are Arachne's coverage inventory at the cited SHAs (batch-1
recheck at `1f7bde0`, plus earlier story PRs). They are historical evidence, not
a statement about main `18519709`. Arachne's PASS covers `1f7bde0` only; the
later #516/#517 heads have moved.

Paths are under `packages/webapp/`. Status words: **Covered**, **Covered-weak**
(a test pins a colour value rather than a contrast ratio), **Not covered**,
**Partly**, **Documented**.

Paths marked † are absent from main `18519709` and live in unmerged PRs such as
#511–#517. A path that exists on main may still lack the cited assertion. For
example, the viewer-name colour checks are at `1f7bde0`, not on main, where
`e2e/mobile.spec.ts` is only 103 lines. Re-check path and assertion on the
current head before relying on either.

### Covered or partly covered

| Finding | PR / SHA | Status | Where |
| --- | --- | --- | --- |
| Toast re-trigger didn't restart timer (P3) | #500, fixed 8265d51 | Covered | `src/components/design/GameRoomPrimitives.test.tsx` |
| IconButton 44px circle | #500 | Covered | `e2e/icon-button-circle.spec.ts` |
| AP dots aria-label on role-less div (P2) | #501, fixed 954fc1c | Covered | `src/components/board/ContextAction.test.tsx` |
| Sticky strip broken by `overflow-x:hidden` (P2) | #513 | Covered | `e2e/sticky-strip.spec.ts` † |
| Starter rotation / queue matches actor | #517 | Covered at `1f7bde0`. Follow-up: extend to the `starterRotation` option (none / clockwise / counterclockwise) | `src/game/roundRotation.test.ts` †, `e2e/game-flow.spec.ts` |
| Remove × is an inline SVG, not a text glyph (P3, #502) | #502 | Covered on main: the case checks `remove.querySelector('svg')` and that the control is not a `×` glyph. Not re-run in this change. Visual ink alignment, if inspected, stays judgement | `src/components/board/JobTile.test.tsx` |
| Dev gear over ⋯ menu on mobile | a909c7b | Covered | `e2e/mobile.spec.ts` |
| Medium/Small buttons under 44px hit area (P3) | #500 | Partly (IconButton only) | `e2e/icon-button-circle.spec.ts` |
| Round-start overlay once per round, focus on 知道了, Escape closes | #515 | Partly | `src/components/board/RoundStartOverlay.test.tsx` †, `src/components/board/useRoundStartOverlay.test.tsx` † |
| History is session-only (P3) | #512 | Documented | `src/components/board/gameHistory.test.ts` † |

### Covered-weak

| Finding | Today | Fix |
| --- | --- | --- |
| Event button orange 3.44:1 (P2, #514, fixed 1f7bde0) | `src/components/board/EventButton.test.tsx` † parses `globals.css` | Add computed-ratio check in `e2e/a11y.spec.ts` |
| Viewer name 4.12:1 on mobile (P2, #511) | At `1f7bde0` (not on main): `toHaveCSS('color', 'rgb(197, 56, 8)')` at `e2e/game-flow.spec.ts:265` and `e2e/mobile.spec.ts:209` | Replace with ratio ≥ 4.5 |

### Not covered: promote now

| Finding | PR | Proposed test | Where |
| --- | --- | --- | --- |
| Primary button white on orange 3.44:1 (P2; fixed `#d83d0a`, 4.57) | #500 | Computed contrast on 結束我的回合 / primary buttons at 1280 and 390 | new `e2e/a11y.spec.ts` |
| Focus ring 2.87:1 (P3; fixed `#168293`) | #500 | Tab to each control, outline vs background ≥ 3:1 | `e2e/a11y.spec.ts` |
| Medium/Small hit area < 44px (P3) | #500 | Box ≥ 44 or `elementFromPoint` at the edge hits the button | `e2e/a11y.spec.ts` |
| 8–9px sublabels 3.82:1 (P3) | #501 | axe `color-contrast` + computed font-size ≥ 12px on the action panel | `e2e/a11y.spec.ts` |
| YOUR PROJECT tag 4.36:1 (P2; fixed 9736f04) | #503 | Computed contrast on project tag after starting a project | `e2e/a11y.spec.ts` |
| Seat initials 2.91–3.75:1 (P2) | #503 | axe `color-contrast` on ProjectCard with contributors | `e2e/a11y.spec.ts` |
| In-play ProjectCard not keyboard reachable (P2; fixed `button.project-card__control`) | #503 | Tab to the control, Enter/Space toggles `aria-pressed` | `src/components/board/ProjectCardFace.test.tsx` (new) or `e2e/game-flow.spec.ts` |
| Steppers 22x22, no 44px hit area (P2; fixed 35x45 `::after`) | #503 | `elementFromPoint` ±17px around the centre hits the stepper. Exclude axe `target-size` for this node: axe ignores `::after` and still flags 22x22. | `e2e/a11y.spec.ts` |
| ⋯ menu ignores Escape (pre-existing) | a909c7b | Escape closes the menu and returns focus to the button | `e2e/mobile.spec.ts` |
| Round-start overlay: reload in the same round does not re-show; focus lands on 知道了 | #515 | e2e | `e2e/game-flow.spec.ts` |
| No new card faces before 確認人力 (hidden info) | #496 plan review | See [Hidden information](#hidden-information) | `src/game/core/playerView.test.ts` (new), `src/game/core/stage/action/move/removeAndRefillJobs.test.ts` (new), `e2e/game-flow.spec.ts` |
| Whole-board axe sweep | all | `@axe-core/playwright` on S01, S02, S04, S07, S10, S12 at 1280 and 390 | `e2e/a11y.spec.ts` |

## Judgement-only checklist

These stay with the lens bot (Arachne). Do not turn them into tests.

| Item | Why it is judgement |
| --- | --- |
| Design fidelity against Figma and the prototype | Needs a reference: `figma-cache/browser-captures/Page 1/` and `osv-prototype-capture/` (the Figma node-cache entries have no screenshots). There are no Figma mobile frames |
| Copy and Chinese/English pairing | Wording and bilingual pairing need a reader |
| Readability and hierarchy | Taste |
| Empty right rail (F4) | A layout choice |
| Initials as decoration (F6) | A design decision |
| Title treatment | Taste |
| Motion feel | Taste |

Hidden information in animations is **not** taste. It is a game rule.

## Hidden information

Wireframes, animations and the DOM must never reveal hidden information (deck
draws, unseen hands, unconfirmed refill results) before the confirming action.

- Until 確認人力 is accepted, refill must not reveal incoming cards: no new
  faces, no card backs entering, no count hints that a draw has happened.
- × / swap only turns the old card into a same-identity ghost. 取消 restores
  the originals and reveals nothing.
- New faces may appear only after 確認人力 is accepted.
- Origin: caught in plan review of a #496 wireframe (see the restyle batch 2
  lessons), not from issue #496 itself and not from an Arachne review. Figma
  換人力1.1.3 must not be followed on this point.
- `playerView` must strip decks and other players' hands.

Planned tests:

- Jest: `playerView` never carries `decks` or other players' hands, and
  `removeAndRefillJobs` draws only in the confirm move.
- One e2e DOM check: market job names stay the same set (ghosts allowed) until
  確認人力.

## Known traps and gaps

- The seed only works offline: `DevGameHost` sets `game.seed`, SocketIO ignores
  it. Online and multiplayer views are never seeded.
- `/dev` is fixed at 3 players (`NUM_DEV_PLAYERS`), so these runs do not cover
  2- or 4-player layouts. Engine Jest tests cover rotation for 2/3/4 players,
  not rendered layout.
- Switching perspective remounts the board and resets session-only state
  (history, the round-start "seen" flag in `sessionStorage`). Do not report
  that as a bug.
- There are no Figma mobile frames, so mobile fidelity is judgement.
- Staging loses in-memory matches when idle.
- The header menu backdrop can intercept clicks on mobile.
- Do not validate components on scratch pages that are not in the repo. Use the
  real board.

## Findings ledger

Each finding gets an id, a lens and a status:

| Status | Meaning |
| --- | --- |
| `runbook` | Checked by hand from this file |
| `scripted` | Captured or checked by the capture script |
| `ci-test` | Enforced by a CI test |
| `covered-weak` | A test exists but pins a value, not the property |
| `judgement-only` | Stays with the lens bot; a reason is required |

A finding **cannot be closed** until it is a `ci-test` or marked
`judgement-only` with a reason.

Example:

| Id | Lens | Finding | Status | Test / reason |
| --- | --- | --- | --- | --- |
| F-viewer-contrast | accessibility | Viewer name 4.12:1 on mobile (P2, #511) | `covered-weak` | At `1f7bde0`, `e2e/mobile.spec.ts:209` pins `rgb(197, 56, 8)`; replace with a ratio ≥ 4.5 check |

## Cleanup and limits

- Remove the temporary worktree.
- Stop dev/production servers (and any game server).
- Close browsers. At most 2 browsers at a time.
- One validation at a time.

## Planned: capture script

> **Not yet implemented.**

- `packages/webapp/scripts/ui-capture.ts`
- A Playwright project `ui-capture` in `playwright.config.ts`
- Inputs: `BASE_URL` (local or staging) and `--sha`
- Reuse the journey helpers in `e2e/game-flow.spec.ts`
- Output follows the [artifact layout](#artifact-layout)

The same journeys feed the CI checks below.

## Planned: CI

> **Not yet implemented.**

**Accessibility.** New `e2e/a11y.spec.ts` using `@axe-core/playwright` (a new
devDependency; today axe is only a transitive dependency of
`eslint-plugin-jsx-a11y`). Runs on S01, S02, S04, S07, S10 and S12 at 1280 and
390, with an allowlist for pre-existing nodes (header tag-en 3.72:1).

**Pixel diffs.** Advisory at first (about 2 weeks).

- Start per component: JobTile, ProjectCard, round-start overlay and event
  dialog, at 1280 and 390. Do not start with whole-page diffs.
- Copy the homepage screenshot workflow: baselines are made only on
  `ubuntu-latest` by `update-homepage-visual-baselines.yml`.
- Pin or self-host fonts first: `next/font/google` fetches at build time.
- Use a deterministic seed, reduced motion, small per-component shots and
  explicit thresholds.
