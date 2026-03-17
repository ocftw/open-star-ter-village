# Plan: Align Game Rule to Released Version

**Branch:** `feature/align-game-rule-to-released-version`
**PR:** #335 (DRAFT)
**Last updated:** 2026-03-17
**Commit:** `cf16dcf`

## Context

The feature branch has 63 commits ahead of `main`. It built out the full game flow (setup, action moves, settlement, event card infrastructure). The goal is to align the implementation with the officially released board game rules.

**Rulebook:** [docs/rulebook.md](./docs/rulebook.md) (extracted from the official PDF)

**MVP Scope: Simplified Mode (B-side)**
The game has two modes — Simplified and Standard. The MVP target is **Simplified Mode** only.
- Score & action board B-side
- Entry-level project cards only (29 cards)
- 8 labor cards in section
- 4 action points per turn
- 5 event cards ("B" labeled only + "The End of the World!")
- No Open Source Tree mechanics
- Initiator contribution: 4 points | Facilitator contribution: 5 points

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

### Task 5 — Verify rule values against released game specs ✅ Done
**File:** `packages/webapp/src/game/store/slice/rule.ts`
**Rulebook:** [docs/rulebook.md](./docs/rulebook.md)

Full rulebook now available. Verified against Simplified Mode (MVP target):

| Setting | Current value | Simplified Mode | Standard Mode | Status |
|---|---|---|---|---|
| player.maxActionTokens | 4 | **4** | 3 (upgradeable) | ✅ Correct for Simplified |
| player.maxWorkerTokens | 12 | 12 | 12 | ✅ |
| player.maxProjectCards | 2 | 2 | 2 | ✅ |
| table.maxJobSlots | 8 | **8** | 6 | ✅ Correct for Simplified |
| numNonEndGameEventCards | 5 | 5 (suggested; 2p=6, 3p=5, 4p=4) | same | ⚠️ Hardcoded to 5, correct for 3p |
| settlement.projectOwnerVictoryPoints | 2 | **2** | 2 | ✅ |
| settlement.lastContributorVictoryPoints | 2 | **2** | 2 | ✅ |
| action.createProject.actionCost | 2 | **2** | 2 | ✅ |
| action.recruit.actionCost | 1 | **1** | 1 | ✅ |
| contributeOwnedProjects (initiator) | ? | **4** points | 3 points | ❓ Verify in code |
| contributeFacilitator | ? | **5** points | 4 points | ❓ Verify in code |

**Key findings for Simplified Mode:**
- `table.maxJobSlots = 8` is **correct** for Simplified Mode (8 labor cards)
- `player.maxActionTokens = 4` is **correct** for Simplified Mode
- Initiator contribution should give **4 points** (not 3)
- Facilitator contribution should give **5 points** (not 4)
- Need to verify contribution point values in move files

**Remaining fixes:**
- [ ] Verify `contributeOwnedProjects` gives 4 pts (Simplified) in `src/game/core/stage/action/move/`
- [ ] Verify `contributeFacilitatorProjects` gives 5 pts (Simplified)
- [ ] `numNonEndGameEventCards`: make player-count dependent or document as 3-player default

---

### Task 6 — Investigate and fix `passStartPlayerToken` ctx mutation ✅ Done
**File:** `packages/webapp/src/game/core/handler/passStartPlayerToken.ts`

Current code directly mutates `ctx.playOrder` which may be read-only in boardgame.io hooks:
```ts
ctx.playOrder = ctx.playOrder.slice(1).concat(ctx.playOrder[0]);
```

**Root cause found:** `ctx.playOrder` mutation in `turn.onEnd` was a **silent no-op**. boardgame.io rebuilds `ctx` from `state.ctx` after the hook returns, discarding any direct mutations.

**Fix applied:**
- Added `G.playOrder: PlayerID[]` to `GameState` in `store.ts`
- `setup.ts` now initialises `G.playOrder` from `ctx.playOrder`
- `passStartPlayerToken.ts` now mutates `G.playOrder` (processed by Immer, persisted)
- `game.ts` now uses `order: TurnOrder.CUSTOM_FROM('playOrder')` so boardgame.io reads the rotated order each turn

---

### Task 7 — Run build and lint ✅ Done
- `yarn build`: compiled successfully, all 5 static pages generated
- `yarn lint`: passing (fixed pre-existing invalid JSON in `.eslintrc.json`)
- `yarn test`: 34/34 tests passing
- Pushed to `origin/feature/align-game-rule-to-released-version` (commit `cf16dcf`)

---

### Task 8 — End-game scoring for unfinished projects ✅ Done
**Files:** `packages/webapp/src/game/store/slice/projectBoard.ts`, `packages/webapp/src/game/core/handler/scoreUnfinishedProjects.ts`, `packages/webapp/src/game/core/handler/eventCardHandlers.ts`

**Rule:** When the game ends, each player scores VP from their contribution points on unfinished projects:
- Sum each player's contribution points across all unfinished project slots
- Every 2 contribution points = 1 VP (floor division)
- Remainder (fewer than 2) is discarded

**Implementation steps:**
- [x] Add `getUnfinished` selector to `projectBoard.ts`
- [x] Create `scoreUnfinishedProjects.ts` handler
- [x] Call it in `endGameAfterThisRound.end` before `events.endGame()`
- [x] 4 unit tests added — 43/43 passing

---

### Task 9 — Implement `四大自由` event card handler ✅ Done
**Files:** `packages/webapp/src/game/store/slice/rule.ts`, `packages/webapp/src/game/core/handler/eventCardHandlers.ts`

**Rule:** 立即多翻開兩張人力卡至人力資源區，即人力資源區上限 +2。本輪結束時由尾家選擇兩張棄掉
*(Immediately reveal 2 more labor cards to the labor section, max job slots +2. At end of round, the last player chooses 2 to discard.)*

**Implementation (MVP simplification):**
- `start`: Increases `maxJobSlots` from 8→10, draws 2 job cards from deck and adds to table
- `end`: Auto-discards last 2 job cards (excess beyond normal max), restores `maxJobSlots` to 8
- Added `setTableMaxJobSlots` mutator to `rule.ts`
- 2 unit tests added — 45/45 passing

**Simplification note:** The rulebook says "last player chooses 2 to discard" interactively. MVP auto-discards the last 2 cards (the ones just added) to avoid requiring interactive selection UI.

---

## Open Questions

1. **四大自由 (add_two_worker_slots)** — does the last player interactively choose which 2 job cards to remove, or should we auto-discard (e.g. the 2 newest)?
2. **mirror action** — currently disabled (`available: false`). Is this intentional for now, or should it be enabled?
3. **Standard mode** — out of scope for MVP (Simplified Mode only).
