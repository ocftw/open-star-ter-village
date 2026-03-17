# Plan: Align Game Rule to Released Version

**Branch:** `feature/align-game-rule-to-released-version`
**PR:** #335 (DRAFT)
**Last updated:** 2026-03-17

## Context

The feature branch has 63 commits ahead of `main`. It built out the full game flow (setup, action moves, settlement, event card infrastructure). The goal is to align the implementation with the officially released board game rules.

**Limitation:** No physical rulebook is available. Rule values in `rule.ts` are inferred from code and cannot be verified without the rulebook. See Task #5.

---

## Task List

### Task 1 — Fix duplicate project cards in `projects.json` ✅ Ready
**File:** `packages/webapp/src/game/data/card/projects.json`

`projects.json` has ~44 entries but 10 cards appear twice. The second occurrence has the corrected values where they differ.

Cards with differing values (second is correct):
- 開放街圖: difficulty **2** → **3**
- 政治獻金透明化修法: difficulty **2** → **3**
- 政府資料開放平臺: description differs → keep second

All 10 duplicates to remove (first occurrence):
`台灣賄選實價登錄地圖`, `政府資料開放平臺`, `民意代表投票指南`, `立法院會議直播`, `開放街圖`, `資料申請小幫手`, `全民追公車`, `政治獻金透明化修法`, `Common Voice`, `口罩地圖`

**Acceptance:** Final JSON has ~34 unique project cards, valid JSON, no duplicates.

---

### Task 2 — Fix `endGameAfterThisRound` event card handler bug ✅ Ready
**File:** `packages/webapp/src/game/core/handler/eventCardHandlers.ts`
**File:** `packages/webapp/src/game/store/slice/rule.ts`

The `start` handler calls `RuleMutator.setSettlementLastContributorVictoryPoints(G.rules, 1)` but the event card says "each leftover action token = +1 VP" → should update `leftoverActionTokensVictoryPoints`.

Steps:
- [ ] Add `setSettlementLeftoverActionTokensVictoryPoints(rule, vp)` mutator to `rule.ts`
- [ ] Export it from `RuleMutator`
- [ ] Fix `start`: call new mutator with value `1`
- [ ] Fix `end`: reset `leftoverActionTokensVictoryPoints` to `0` (not `lastContributorVictoryPoints`)

---

### Task 3 — Implement missing event card handlers ✅ Ready
**File:** `packages/webapp/src/game/core/handler/eventCardHandlers.ts`

Only `end_game_after_this_round` is handled. Five basic cards need handlers:

| Card | function_name | Effect |
|---|---|---|
| 人力釋出 | `discard_and_refill_all_worker_slots` | Discard all job slots, refill to max immediately |
| 斜槓青年 | `ignore_first_worker_requirement` | First job card in createProject/recruit ignores job type matching this round |
| 四大自由 | `add_two_worker_slots` | maxJobSlots +2, draw 2 more job cards; last player removes 2 at end of round |
| 會計年度結算 | `project_owner_gets_two_points` | Projects settled this round: owner gets +2 extra VP |
| 青年補助 | `the_only_player_with_the_lowest_victory_points_gets_one_extra_action_token` | Sole lowest-score player gets +1 action token |
| 番茄醬工作法 | `increase_one_owned_project_contribution_value` | contributeOwnedProjects maxContributionValue +1 this round |

Implementation notes:
- `斜槓青年`, `四大自由`, `會計年度結算`, `番茄醬工作法` need a `rule.event` field for ephemeral per-round flags
- `斜槓青年`: `createProject.ts` and `recruit.ts` must check the flag
- `會計年度結算`: `settleProjects.ts` must apply the extra owner VP
- `四大自由` `end`: verify exact mechanic (auto-remove or player-choice) against rulebook

---

### Task 4 — Add unit tests for game core logic ⛔ Blocked by #2, #3
**File:** `packages/webapp/src/game/` (new test files)

Run with: `cd packages/webapp && yarn test`

Tests to write:
- [ ] `utils.test.ts` — `reservoirSampling` edge cases
- [ ] Move: `createProject` — happy path, insufficient tokens, occupied slot, invalid job card
- [ ] Move: `recruit` — happy path, worker already assigned, requirement already fulfilled
- [ ] Move: `contributeOwnedProjects` — happy path, exceed max, not owner
- [ ] Move: `contributeJoinedProjects` — happy path, exceed max, is owner (should fail)
- [ ] Move: `removeAndRefillJobs` — happy path, job not found
- [ ] Handler: `settleProjects` — correct VP scoring, worker token return, bonus VP
- [ ] Handler: `scoreLeftoverActionTokens` — scores when VP > 0, skips when VP = 0
- [ ] Handler: `refill` — replenishes cards, resets action tokens, resets action slots
- [ ] Event: `endGameAfterThisRound` — sets/resets leftoverActionTokensVictoryPoints
- [ ] Event: each new handler from Task #3

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

### Task 7 — Run build and lint ⛔ Blocked by #1–#6
```bash
cd packages/webapp && yarn build
cd packages/webapp && yarn lint
cd packages/webapp && yarn test
```
All must pass before the PR moves out of DRAFT.

---

## Open Questions

1. **Rulebook** — do we have access to the physical game rulebook to verify rule values (Task #5)?
2. **四大自由 (add_two_worker_slots)** — does the last player choose which 2 job cards to remove, or is it auto (e.g., oldest)?
3. **mirror action** — currently disabled (`available: false`). Is this intentional for now, or should it be enabled?
4. **Standard mode** — `settleProjects.ts` has a TODO for OpenSourceTree in standard mode. Is standard mode in scope for this branch?
