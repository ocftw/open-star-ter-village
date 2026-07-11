/**
 * E2E tests: Simplified Mode action flow (Scenarios 1–10), card-driven UI.
 *
 * Scenarios 1–4 are based on the rulebook demo (pages 10–12).
 * Scenarios 5–10 cover event banner, turn indicator, endActionTurn,
 * contributions, and mirror.
 *
 * Interaction model (redesign, RFC #399): there is no action toolbar.
 * - Tap a hand card  → create-project mode (then tap a job card to assign)
 * - Tap a job card   → recruit mode (then tap a project slot)
 * - Tap a project    → contribute mode (own vs joined inferred by ownership)
 * - 換人力 Refill / 加班 Mirror are affordances next to the job market
 * - The contextual bar [data-testid="context-action"] carries mode
 *   (data-mode) and the confirm/cancel buttons (ca-confirm / ca-cancel).
 *
 * The game boots in DevView at localhost:3000/dev.
 * Alice (player 0) always goes first and is the active tab on load.
 * TabPanel only mounts children for the active tab, so there are no duplicate selectors.
 */
import { test, expect, Page } from '@playwright/test';

// ── Constants from the rulebook (Simplified Mode) ────────────────────────────
const INITIAL_ACTION_TOKENS    = 4;
const CREATE_PROJECT_COST      = 2;
const RECRUIT_COST             = 1;
const TALENT_SCOUTING_COST     = 1;
const CONTRIBUTE_OWN_COST      = 1;
const CONTRIBUTE_JOIN_COST     = 1;
const MIRROR_COST              = 1;
const CREATE_PROJECT_VP        = 2;
const TALENT_SCOUTING_VP       = 1;

// ── Helpers ──────────────────────────────────────────────────────────────────

const contextAction = (page: Page) => page.locator('[data-testid="context-action"]');
const confirmButton = (page: Page) => page.locator('[data-testid="ca-confirm"]');

/** Wait until the idle contextual bar is visible — game initialised, current player's turn. */
async function waitForGameReady(page: Page) {
  await page.locator('[data-testid="context-action"][data-mode="idle"]').waitFor({ state: 'visible', timeout: 20000 });
}

/** Alice's header status chip; AP and score are exposed as data attributes. */
const aliceStatus = (page: Page) => page.locator('[data-testid="player-status-Alice"]');

async function expectActions(page: Page, name: string, actions: number) {
  await expect(page.locator(`[data-testid="player-status-${name}"]`)).toHaveAttribute('data-actions', String(actions));
}

async function expectScore(page: Page, name: string, score: number) {
  await expect(page.locator(`[data-testid="player-status-${name}"]`)).toHaveAttribute('data-score', String(score));
}

/** End the current player's action turn: idle bar → 結束我的回合 → confirm. */
async function performEndTurn(page: Page): Promise<void> {
  await page.locator('[data-testid="end-turn"]').click();
  await expect(contextAction(page)).toHaveAttribute('data-mode', 'endActionTurn');
  await confirmButton(page).click();
}

/**
 * Create a project via the card-driven flow: tap a compatible hand card
 * (enters create mode), then tap a matching job card. Returns the job name used.
 *
 * @param requireMultipleJobTypes - when true, prefer hand cards with 2+ different
 *   job requirements so a different job type remains for a subsequent recruit.
 */
async function selectCompatibleHandAndJobCard(page: Page, requireMultipleJobTypes = false): Promise<string> {
  const handCards = page.locator('[data-testid^="hand-card-"]');
  const jobCards  = page.locator('[data-testid^="job-card-"]');

  const passes = requireMultipleJobTypes ? [true, false] : [false];

  for (const requireMulti of passes) {
    const handCount = await handCards.count();
    for (let h = 0; h < handCount; h++) {
      const handCard = handCards.nth(h);
      const requirements = await handCard.getAttribute('data-requirements');
      if (!requirements) continue;
      const reqList = requirements.split(',').map(r => r.trim()).filter(Boolean);
      if (requireMulti && reqList.length < 2) continue;

      const jobCount = await jobCards.count();
      for (let j = 0; j < jobCount; j++) {
        const jobCard = jobCards.nth(j);
        const jobName = (await jobCard.getAttribute('data-job-name'))?.trim() ?? '';
        if (reqList.includes(jobName)) {
          await handCard.click();
          // Tapping a hand card from idle must enter create mode (inference works).
          await expect(contextAction(page)).toHaveAttribute('data-mode', 'createProject');
          await jobCard.click();
          return jobName;
        }
      }
    }
  }
  throw new Error('No compatible hand-card + job-card combination found for createProject');
}

/**
 * Recruit via the card-driven flow: tap a compatible job card (enters recruit
 * mode from idle), then tap the target project slot.
 *
 * @param preferHighRequirement - when true, prefer jobs whose requirement exceeds
 *   the initial contribution (2), so the slot still has room afterwards.
 */
async function selectCompatibleJobAndProjectSlot(
  page: Page,
  ownerJobName: string,
  preferHighRequirement = false,
): Promise<void> {
  const projectSlots = page.locator('[data-testid^="project-slot-"]');
  const jobCards     = page.locator('[data-testid^="job-card-"]');

  const passes = preferHighRequirement ? [true, false] : [false];

  for (const requireHighReq of passes) {
    const slotCount = await projectSlots.count();
    for (let s = 0; s < slotCount; s++) {
      const slot = projectSlots.nth(s);
      const requirements = await slot.getAttribute('data-requirements');
      if (!requirements) continue;

      const jobReqJson = await slot.getAttribute('data-job-requirements');
      const jobReqMap: Record<string, number> = jobReqJson ? JSON.parse(jobReqJson) : {};

      // Exclude the job already placed as owner so we don't hit the hasWorker guard
      const reqList = requirements.split(',').map(r => r.trim()).filter(r => r && r !== ownerJobName);
      if (reqList.length === 0) continue;

      const jobCount = await jobCards.count();
      for (let j = 0; j < jobCount; j++) {
        const jobCard = jobCards.nth(j);
        const jobName = (await jobCard.getAttribute('data-job-name'))?.trim() ?? '';
        if (!reqList.includes(jobName)) continue;

        const INITIAL_CONTRIBUTION = 2;
        if (requireHighReq && (jobReqMap[jobName] ?? 0) <= INITIAL_CONTRIBUTION) continue;

        await jobCard.click();
        // Tapping a job card from idle must enter recruit mode (inference works).
        await expect(contextAction(page)).toHaveAttribute('data-mode', 'recruit');
        await slot.click();
        return;
      }
    }
  }
  throw new Error(`No compatible job-card + project-slot for recruit (ownerJob="${ownerJobName}")`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Simplified Mode — Action Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Fixed boardgame.io seed keeps card and job deals deterministic in CI.
    await page.goto('/dev?seed=e2e-2');
    await waitForGameReady(page);
  });

  // ── Scenario 1: Turn start ─────────────────────────────────────────────────
  test('Scenario 1: Alice starts her turn with 4 action tokens', async ({ page }) => {
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS);
  });

  // ── Scenario 2: Initiate a Project ────────────────────────────────────────
  test('Scenario 2: Initiate a Project — costs 2 AP and awards 2 VP', async ({ page }) => {
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS);
    await expectScore(page, 'Alice', 0);

    // Tap hand card → tap job card (card-driven, no toolbar)
    await selectCompatibleHandAndJobCard(page);

    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify outcome: 2 AP spent, 2 VP gained
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST);
    await expectScore(page, 'Alice', CREATE_PROJECT_VP);
  });

  // ── Scenario 3: Recruit Talents ───────────────────────────────────────────
  test('Scenario 3: Recruit Talents — costs 1 AP and places a token on a project', async ({ page }) => {
    // Prerequisite: put a project on the board with a second job type.
    const ownerJobName = await selectCompatibleHandAndJobCard(page, true);
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Back to idle, then recruit: tap job card → tap project slot.
    await waitForGameReady(page);
    await selectCompatibleJobAndProjectSlot(page, ownerJobName);

    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify: 2 (create) + 1 (recruit) = 3 AP spent → 1 remaining
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST - RECRUIT_COST);
  });

  // ── Scenario 4: Talent Scouting (refill via the job-deck affordance) ──────
  test('Scenario 4: Talent Scouting — costs 1 AP and awards 1 VP', async ({ page }) => {
    await expectScore(page, 'Alice', 0);

    // 換人力 Refill is a board affordance next to the job market.
    await page.locator('[data-testid="refill-jobs"]').click();
    await expect(contextAction(page)).toHaveAttribute('data-mode', 'removeAndRefillJobs');

    // Select at least one job card to remove.
    await page.locator('[data-testid^="job-card-"]').first().click();

    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify: 1 AP spent, 1 VP gained
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST);
    await expectScore(page, 'Alice', TALENT_SCOUTING_VP);
  });

  // ── Scenario 5: Event card banner ─────────────────────────────────────────
  test('Scenario 5: Event card banner — visible at game start', async ({ page }) => {
    // playEventCard runs in onBegin for Alice's first turn (playOrderPos === 0),
    // so there should always be an event in the slot immediately after load.
    await expect(page.locator('[data-testid="event-card-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-card-banner"]')).toContainText('EVENT');
  });

  // ── Scenario 6: Turn indicator ────────────────────────────────────────────
  test('Scenario 6: Turn indicator — non-active players see a waiting alert', async ({ page }) => {
    // While it's Alice's turn, Bob's and Charlie's tabs must show the waiting alert.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await expect(page.locator('[data-testid="waiting-for-player-alert"]')).toBeVisible();

    await page.getByRole('tab', { name: 'Charlie view' }).click();
    await expect(page.locator('[data-testid="waiting-for-player-alert"]')).toBeVisible();

    // Switching back to Alice's tab: her contextual bar must still be present.
    await page.getByRole('tab', { name: 'Alice view' }).click();
    await expect(page.locator('[data-testid="context-action"][data-mode="idle"]')).toBeVisible();
  });

  // ── Scenario 7: endActionTurn ─────────────────────────────────────────────
  test('Scenario 7: endActionTurn — Alice ends early, Bob\'s bar appears', async ({ page }) => {
    // Alice ends her turn without spending any AP.
    await performEndTurn(page);

    // It is now Bob's turn — his idle contextual bar must be visible in his tab.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await expect(page.locator('[data-testid="context-action"][data-mode="idle"]')).toBeVisible({ timeout: 5000 });
  });

  // ── Scenario 8: contributeOwnedProjects ───────────────────────────────────
  test('Scenario 8: contributeOwnedProjects — costs 1 AP and records contribution', async ({ page }) => {
    // Prerequisite: Alice must have at least one worker token on her own project.
    await selectCompatibleHandAndJobCard(page);
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST);
    await waitForGameReady(page);

    // Tap her project on the board — ownership infers contribute (own).
    await page.locator('[data-testid^="project-slot-"][data-requirements]').first().click();
    await expect(contextAction(page)).toHaveAttribute('data-mode', 'contributeOwnedProjects');

    // Before any interaction the contribution delta is 0 → confirm disabled.
    await expect(confirmButton(page)).toBeDisabled();

    // Increment Alice's first visible worker contribution by 1 (steppers live on the card).
    await page.locator('[data-testid="contribution-increment"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="contribution-increment"]').first().click();

    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify: contributeOwnedProjects cost 1 AP → 1 AP remaining.
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST - CONTRIBUTE_OWN_COST);
  });

  // ── Scenario 9: Doin' Overtime (mirror) ───────────────────────────────────
  test('Scenario 9: Doin\' Overtime (mirror) — repeats a prior 1-AP action', async ({ page }) => {
    // Step A: Alice performs Talent Scouting (refill) — 1 AP, 1 VP.
    await page.locator('[data-testid="refill-jobs"]').click();
    await expect(contextAction(page)).toHaveAttribute('data-mode', 'removeAndRefillJobs');
    await page.locator('[data-testid^="job-card-"]').first().click();
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST);
    await expectScore(page, 'Alice', TALENT_SCOUTING_VP);

    // Step B: 加班 mirror — a board affordance; pick the occupied action to repeat.
    await waitForGameReady(page);
    await page.locator('[data-testid="mirror-slot"]').click();
    await expect(contextAction(page)).toHaveAttribute('data-mode', 'mirror');
    await page.locator('[data-testid="mirror-pick-removeAndRefillJobs"]').click();

    // Mirror step 1: configure the repeated action (same UX as refill).
    await page.locator('[data-testid^="job-card-"]').first().click();
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify: 3 AP spent total (refill + mirror overhead + sub-action), 2 VP earned.
    await expectActions(
      page, 'Alice',
      INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST - MIRROR_COST - TALENT_SCOUTING_COST,
    );
    await expectScore(page, 'Alice', TALENT_SCOUTING_VP + TALENT_SCOUTING_VP);
  });

  // ── Scenario 10: contributeJoinedProjects ─────────────────────────────────
  test('Scenario 10: contributeJoinedProjects — recruit on another player\'s project and contribute', async ({ page }) => {
    // === Round 1 ===
    // Alice: end turn immediately so Bob can create a project.
    await performEndTurn(page);

    // Bob: create a project with 2+ job types so Alice can recruit on it later.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await waitForGameReady(page);
    await selectCompatibleHandAndJobCard(page, true); // requireMultipleJobTypes
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();
    await waitForGameReady(page);
    await performEndTurn(page);

    // Charlie: end turn (completes round 1).
    await page.getByRole('tab', { name: 'Charlie view' }).click();
    await waitForGameReady(page);
    await performEndTurn(page);

    // === Round 2: Alice still goes first. ===
    await page.getByRole('tab', { name: 'Alice view' }).click();
    await waitForGameReady(page);

    // Alice recruits onto Bob's project (she is NOT the owner).
    // preferHighRequirement=true ensures the slot still has room after the
    // initial contribution of 2.
    await selectCompatibleJobAndProjectSlot(page, '', true);
    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // recruit cost 1 AP → 3 remaining.
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - RECRUIT_COST);
    await waitForGameReady(page);

    // Alice taps Bob's project — ownership infers contribute (joined).
    await page.locator('[data-testid^="project-slot-"][data-requirements]').first().click();
    await expect(contextAction(page)).toHaveAttribute('data-mode', 'contributeJoinedProjects');
    await expect(confirmButton(page)).toBeDisabled();

    // Increment Alice's contribution on a row that still has remaining capacity.
    const incrementWithRoom = page.locator('[data-testid="contribution-increment"]:not([data-remaining="0"])');
    await incrementWithRoom.first().waitFor({ state: 'visible' });
    await incrementWithRoom.first().click();

    await expect(confirmButton(page)).toBeEnabled();
    await confirmButton(page).click();

    // Verify: recruit (1) + contributeJoinedProjects (1) = 2 AP spent → 2 remaining.
    await expectActions(page, 'Alice', INITIAL_ACTION_TOKENS - RECRUIT_COST - CONTRIBUTE_JOIN_COST);
  });
});
