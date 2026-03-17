# Plan: Align Game Rule to Released Version

**Branch:** `feature/align-game-rule-to-released-version`
**PR:** #335 (DRAFT)
**Last updated:** 2026-03-17
**Commit:** `cf16dcf`

## Context

The feature branch has 63 commits ahead of `main`. It built out the full game flow (setup, action moves, settlement, event card infrastructure). The goal is to align the implementation with the officially released board game rules.

**Limitation:** No physical rulebook is available. Rule values in `rule.ts` are inferred from code and cannot be verified without the rulebook. See Task #5.

---

## Task List

### Task 1 — Fix duplicate project cards in `projects.json` ✅ Done
**File:** `packages/webapp/src/game/data/card/projects.json`

Removed first occurrence of 10 duplicate cards. Final count: **39 unique project cards**.
Corrected values kept: 開放街圖 difficulty=3, 政治獻金透明化修法 difficulty=3.

---

### Task 2 — Fix `endGameAfterThisRound` event card handler bug ✅ Done
**Files:** `eventCardHandlers.ts`, `rule.ts`

- Added `setSettlementLeftoverActionTokensVictoryPoints` mutator to `rule.ts`
- Fixed `start`/`end` to correctly update `leftoverActionTokensVictoryPoints` instead of `lastContributorVictoryPoints`

---

### Task 3 — Implement missing event card handlers ✅ Done (5 of 6)
**Files:** `eventCardHandlers.ts`, `rule.ts`, `players.ts`, `scoreBoard.ts`, `settleProjects.ts`, `createProject.ts`, `recruit.ts`

| Card | function_name | Status |
|---|---|---|
| 人力釋出 | `discard_and_refill_all_worker_slots` | ✅ Done |
| 斜槓青年 | `ignore_first_worker_requirement` | ✅ Done |
| 四大自由 | `add_two_worker_slots` | ⏭ Skipped — needs rulebook clarification on "last player removes 2" mechanic |
| 會計年度結算 | `project_owner_gets_two_points` | ✅ Done |
| 青年補助 | `the_only_player_with_the_lowest_victory_points_gets_one_extra_action_token` | ✅ Done |
| 番茄醬工作法 | `increase_one_owned_project_contribution_value` | ✅ Done |

Also added: `Rule.event` field, `addActionTokens` mutator, `getAllPlayerPoints` selector.

---

### Task 4 — Add unit tests for game core logic ✅ Done
**Files:** `packages/webapp/jest.config.js`, `packages/webapp/src/game/game.test.ts`

**34 tests passing.** Covers:
- `reservoirSampling` utility (4 tests)
- `RuleSlice` — defaults and all new mutators (6 tests)
- `PlayersSlice` — token mutations (6 tests)
- `ScoreBoardSlice` — scoring and getAllPlayerPoints (4 tests)
- `JobSlotsSlice` — add/remove (3 tests)
- All 5 implemented event card handlers — start/end behavior (11 tests)

---

### Task 5 — Verify rule values against released game specs ⚠️ Needs rulebook
**File:** `packages/webapp/src/game/store/slice/rule.ts`

Values to verify with physical rulebook:

| Setting | Current value |
|---|---|
| player.maxActionTokens | 4 |
| player.maxWorkerTokens | 12 |
| player.maxProjectCards | 2 |
| table.maxJobSlots | 8 |
| table.maxProjectSlots | 8 |
| numNonEndGameEventCards | 5 |
| createProject.actionCost | 2 |
| createProject.victoryPoints | 2 |
| createProject.projectOwnerWorkerCost | 1 |
| createProject.assignWorkerCost | 1 |
| createProject.initialContributionValue | 1 |
| recruit.actionCost | 1 |
| recruit.assignWorkerCost | 1 |
| recruit.initialContributionValue | 2 |
| contributeOwnedProjects.actionCost | 1 |
| contributeOwnedProjects.maxContributionValue | 4 |
| contributeJoinedProjects.actionCost | 1 |
| contributeJoinedProjects.maxContributionValue | 5 |
| removeAndRefillJobs.actionCost | 1 |
| removeAndRefillJobs.victoryPoints | 1 |
| settlement.projectOwnerVictoryPoints | 2 |
| settlement.lastContributorVictoryPoints | 2 |

**Blocked by:** access to the physical rulebook.

---

### Task 6 — Investigate and fix `passStartPlayerToken` ctx mutation ✅ Ready
**File:** `packages/webapp/src/game/core/handler/passStartPlayerToken.ts`

Current code directly mutates `ctx.playOrder` which may be read-only in boardgame.io hooks:
```ts
ctx.playOrder = ctx.playOrder.slice(1).concat(ctx.playOrder[0]);
```

Steps:
- [ ] Verify if this mutation works in boardgame.io (check boardgame.io docs)
- [ ] If unsafe: use the correct boardgame.io API (turn order config or events API)
- [ ] Verify start player token rotates correctly each round

---

### Task 7 — Run build and lint ✅ Done
- `yarn build`: compiled successfully, all 5 static pages generated
- `yarn lint`: passing (fixed pre-existing invalid JSON in `.eslintrc.json`)
- `yarn test`: 34/34 tests passing
- Pushed to `origin/feature/align-game-rule-to-released-version` (commit `cf16dcf`)

---

## Open Questions

1. **Rulebook** — do we have access to the physical game rulebook to verify rule values (Task #5)?
2. **四大自由 (add_two_worker_slots)** — does the last player choose which 2 job cards to remove, or is it auto (e.g., oldest)?
3. **mirror action** — currently disabled (`available: false`). Is this intentional for now, or should it be enabled?
4. **Standard mode** — `settleProjects.ts` has a TODO for OpenSourceTree in standard mode. Is standard mode in scope for this branch?
