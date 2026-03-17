# Plan: Align Game Rule to Released Version

**Branch:** `feature/align-game-rule-to-released-version`
**PR:** #335 (DRAFT)
**Last updated:** 2026-03-17
**Commit:** `1952446` (Task 14 added after)

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

### Task 5 — Verify rule values against released game specs ✅ Done (fully verified 2026-03-17)
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

**Verification result (2026-03-17):**
- `contributeOwnedProjects.maxContributionValue = 4` ✅ correct for Simplified Mode (`rule.ts:78`)
- `contributeJoinedProjects.maxContributionValue = 5` ✅ correct for Simplified Mode (`rule.ts:82`)
- Both values are enforced as contribution-point caps in the move guards, not VP awards
- `numNonEndGameEventCards` is now player-count dependent via `getNumNonEndGameEventCardsByPlayerCount` (`rule.ts:129`) ✅

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

### Task 9 — Implement `四大自由` event card handler ✅ Done (interactive discard added in Task 14)
**Files:** `packages/webapp/src/game/store/slice/rule.ts`, `packages/webapp/src/game/core/handler/eventCardHandlers.ts`

**Rule:** 立即多翻開兩張人力卡至人力資源區，即人力資源區上限 +2。本輪結束時由尾家選擇兩張棄掉
*(Immediately reveal 2 more labor cards to the labor section, max job slots +2. At end of round, the last player chooses 2 to discard.)*

**Initial implementation:**
- `start`: Increases `maxJobSlots` from 8→10, draws 2 job cards from deck and adds to table
- `end`: Auto-discards last 2 job cards (excess beyond normal max), restores `maxJobSlots` to 8
- Added `setTableMaxJobSlots` mutator to `rule.ts`
- 2 unit tests added — 45/45 passing

See Task 14 for the full interactive discard implementation.

---

### Task 14 — `四大自由` interactive discard ✅ Done
**Files:** `table.ts`, `eventCardHandlers.ts`, `endActionTurn.ts` (new), `discardExcessJobCards.ts` (new), `action.ts`, `game.ts`, `ActionStepper.selectors.ts`, `BoardGame.tsx`, `DiscardJobCards/DiscardJobCardsPanel.tsx` (new)

**Rule fulfilled:** At end of round the last player interactively selects any 2 job cards from the 10-card board to discard, returning to 8.

**Game state additions** (`table.ts`):
- `fourFreedomsPendingDiscards: string[]` — IDs of the 2 added cards; non-empty signals a discard is required
- `actionPhaseDone: boolean` — set when the last player calls End Action Turn early (still has AP) to signal they are ready to discard

**New moves** (both `client: false`):
- `endActionTurn` — if last player + pending discard: sets `actionPhaseDone = true` (keeps turn alive); otherwise calls `events.endTurn()`
- `discardExcessJobCards(cardIds)` — validates exactly 2 IDs on the table, removes them, discards to deck, clears pending state, calls `events.endTurn()`

**`game.ts` — modified `endIf`:**
Blocks auto-end when last player has `fourFreedomsPendingDiscards.length > 0` (AP=0 no longer auto-ends their turn until they discard).

**UI flow:**
- `ActionStepper.selectors.ts` — `onEndActionTurn` now calls `moves.endActionTurn` (game move) instead of `events.endTurn` directly
- `BoardGame.tsx` — computes `showDiscardPanel = isLastPlayer && hasPendingDiscard && (outOfAP || actionPhaseDone)` and renders `DiscardJobCardsPanel` in place of the action bar
- `DiscardJobCardsPanel` — activates job slot selection on mount, requires exactly 2 selected, confirm calls `discardExcessJobCards`

**Fallback:** `addTwoWorkerSlots.end()` still auto-discards if `fourFreedomsPendingDiscards` is somehow non-empty at round end (safety net only; should not occur in normal play).

49/49 unit tests passing. 10/10 E2E scenarios passing.

---

### Task 10 — Enable and fix mirror (Doin' Overtime) action ✅ Done
**Files:** `rule.ts`, `mirror.ts`, `game.test.ts`

Three bugs fixed in `mirror.ts`:
1. Inverted cost guard (`<= mirrorActionCost` → `> mirrorActionCost`)
2. Missing "already done" check — target slot must be occupied before mirroring
3. Slot reset — temporarily frees target slot so sub-move's `isOccupied` guard passes; sub-move re-occupies it

Also enabled mirror in `rule.ts` (`available: true`). 4 unit tests added — 49/49 passing.

---

### Task 11 — UI: mirror flow, event banner, game end screen, turn indicator ✅ Done
**Files:** `actionStepSlice.ts`, `ActionStepper.selectors.ts`, `ActionStepper.tsx`, `Table.tsx`, `BoardGame.tsx`, `eventCardHandlers.ts`

| Feature | Implementation |
|---|---|
| **Mirror UI** | 2-step wizard: step 0 shows chips for occupied action slots (inline in stepper); step 1 activates same board elements as the mirrored action; confirm calls `onMirror(target, ...params)` |
| **Event card banner** | `Table.tsx` renders an MUI `Alert` with active event `name` + `description` when `G.table.eventSlot !== null` |
| **Game end screen** | `BoardGame.tsx` renders an MUI `Dialog` with sorted final scores and winner highlight when `ctx.gameover` is set |
| **Turn indicator** | Non-current players see a "Waiting for Player X…" `Alert` instead of the action bar |

Also fixed: `scoreUnfinishedProjects` was passed `{ G, events }` instead of the full `FnContext` — corrected to pass the whole context object.

---

### Task 12 — Refactor ActionStepper: ActionConfig interface ✅ Done
**Files:** `ActionStepper/actionConfig.ts` (new), `ActionStepper.selectors.ts`, `ActionStepper.tsx`, `actionStepSlice.ts`

**Problem:** Mirror implementation used 6 separate switch-case helpers that each repeated the same 5-case pattern.

**Solution:** Introduced `ActionConfig` interface in `actionConfig.ts`:

```ts
interface ActionConfig {
  displayName: string;
  steps: { name: string }[];
  activateBoard(activators: ActionBoardActivators): void;
  isStepValid(state: ActionSelectionState): boolean;
  progressMessage(state: ActionSelectionState): string;
  getParams(state: ActionSelectionState): unknown[];
  execute(executors: ActionExecutors, state: ActionSelectionState): void;
}
```

One config object per mirrorable action in `ACTION_CONFIGS: Record<MirrorableActionName, ActionConfig>`. Mirror step 1 delegates directly to `ACTION_CONFIGS[mirrorTarget]` — no duplicated switch logic. `MirrorableActionName = Exclude<ActionMoveName, 'mirror'>` flows through the entire chain for type-safe indexing.

`ActionStepper.tsx` now builds three shared context objects (`selectionState`, `activators`, `executors`) and calls config methods directly.

---

### Task 13 — E2E test coverage for all actions ✅ Done
**File:** `packages/webapp/e2e/game-flow.spec.ts`

Extended the E2E suite from 4 scenarios to 10. All 10 pass.

| Scenario | Coverage |
|---|---|
| 1 | Turn start: Alice has 4 AP |
| 2 | createProject: costs 2 AP, awards 2 VP |
| 3 | recruit: costs 1 AP, places worker token |
| 4 | removeAndRefillJobs (Talent Scouting): costs 1 AP, awards 1 VP |
| 5 | Event card banner visible at game start |
| 6 | Turn indicator: non-active players see waiting alert |
| 7 | endActionTurn: Alice ends early, Bob's action bar appears |
| 8 | contributeOwnedProjects: costs 1 AP, records contribution delta |
| 9 | mirror (Doin' Overtime): repeats removeAndRefillJobs, costs 2 AP total |
| 10 | contributeJoinedProjects: recruit + contribute on another player's project |

Also added:
- `data-testid="event-card-banner"` to `Table.tsx`
- `data-testid="waiting-for-player-alert"` to `BoardGame.tsx`
- `data-testid="contribution-decrement/increment"` + `data-remaining` to `Contribution.tsx`
- `data-job-requirements` (JSON) to `ProjectSlot.tsx` to expose per-job numeric requirements for test targeting

---

## Open Questions

1. **Standard mode** — out of scope for MVP (Simplified Mode only).
