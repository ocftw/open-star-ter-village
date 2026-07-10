/**
 * E2E tests: Simplified Mode action flow (Scenarios 1–10)
 *
 * Scenarios 1–4 are based on the rulebook demo (pages 10–12).
 * Scenarios 5–10 cover actions and UI features added in Tasks 10–12
 * (mirror fix, event banner, turn indicator, endActionTurn, contributions).
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

/** Wait until Alice's ActionBar is visible, meaning the game has initialised and it's her turn. */
async function waitForGameReady(page: Page) {
  await page.locator('[data-testid="action-btn-createProject"]').waitFor({ state: 'visible', timeout: 20000 });
}

/** Alice's player-status block (rendered by PlayerStatus inside UserPanel). */
const aliceStatus = (page: Page) => page.locator('[data-testid="player-status-Alice"]');

/**
 * End the current player's action turn via the End Action Turn button.
 * Waits for the confirmation stepper to appear, then confirms.
 */
async function performEndTurn(page: Page): Promise<void> {
  await page.locator('[data-testid="action-btn-endActionTurn"]').click();
  await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="stepper-next"]').click();
}

/**
 * Wait until the current player's full action bar is visible (game ready for that player).
 */
async function waitForActionBarReady(page: Page): Promise<void> {
  await page.locator('[data-testid="action-btn-createProject"]').waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Select a compatible hand-card + job-card for createProject.
 * Reads each hand card's data-requirements and matches it against the available
 * job-card titles on the board. Returns the job card title that was used.
 *
 * @param requireMultipleJobTypes - when true, only selects cards that have 2+ different
 *   job requirements, ensuring a different job type remains available for a subsequent
 *   recruit action. Falls back to any compatible card if no multi-job card is found.
 *
 * After each click, verifies the selection was registered (proves isInteractive=true).
 */
async function selectCompatibleHandAndJobCard(page: Page, requireMultipleJobTypes = false): Promise<string> {
  const handCards = page.locator('[data-testid^="hand-card-"]');
  const jobCards  = page.locator('[data-testid^="job-card-"]');

  // Two-pass search: first try cards matching the requirement, then fall back.
  // When requireMultipleJobTypes=true, pass 1 requires 2+ job types; pass 2 drops that constraint.
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
        const jobCard  = jobCards.nth(j);
        const jobTitle = (await jobCard.locator('h6').textContent())?.trim() ?? '';
        if (reqList.includes(jobTitle)) {
          await handCard.click();
          // Wait until the hand card selection registers (confirms isHandProjectCardsInteractive=true)
          await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select 1 Hand');
          await jobCard.click();
          return jobTitle;
        }
      }
    }
  }
  throw new Error('No compatible hand-card + job-card combination found for createProject');
}

/**
 * Select a compatible job-card + project-slot for recruit.
 * Reads each project slot's data-requirements and finds a job card that:
 *  - is in the project's requirements
 *  - is NOT the job already claimed as owner (to avoid hasWorker conflict)
 *
 * @param preferHighRequirement - when true, only select jobs whose numeric requirement
 *   exceeds the initial contribution value (2), so the slot still has room after recruit.
 *   Falls back to any compatible job if no high-requirement slot is found.
 */
async function selectCompatibleJobAndProjectSlot(
  page: Page,
  ownerJobName: string,
  preferHighRequirement = false,
): Promise<void> {
  const projectSlots = page.locator('[data-testid^="project-slot-"]');
  const jobCards     = page.locator('[data-testid^="job-card-"]');

  // When preferHighRequirement=true: pass 1 requires job req > 2; pass 2 drops that constraint.
  const passes = preferHighRequirement ? [true, false] : [false];

  for (const requireHighReq of passes) {
    const slotCount = await projectSlots.count();
    for (let s = 0; s < slotCount; s++) {
      const slot = projectSlots.nth(s);
      const requirements = await slot.getAttribute('data-requirements');
      if (!requirements) continue;

      // Parse numeric requirement values when available
      const jobReqJson = await slot.getAttribute('data-job-requirements');
      const jobReqMap: Record<string, number> = jobReqJson ? JSON.parse(jobReqJson) : {};

      // Exclude the job already placed as owner so we don't hit the hasWorker guard
      const reqList = requirements.split(',').map(r => r.trim()).filter(r => r && r !== ownerJobName);
      if (reqList.length === 0) continue;

      const jobCount = await jobCards.count();
      for (let j = 0; j < jobCount; j++) {
        const jobCard  = jobCards.nth(j);
        const jobTitle = (await jobCard.locator('h6').textContent())?.trim() ?? '';
        if (!reqList.includes(jobTitle)) continue;

        // In high-requirement pass, skip jobs whose requirement wouldn't leave room after
        // the initial contribution of 2 is placed.
        const INITIAL_CONTRIBUTION = 2;
        if (requireHighReq && (jobReqMap[jobTitle] ?? 0) <= INITIAL_CONTRIBUTION) continue;

        await jobCard.click();
        // Wait until the job slot selection registers (confirms isJobSlotsInteractive=true)
        await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select 1 Job Slot');
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
    await page.goto('/dev');
    await waitForGameReady(page);
  });

  // ── Scenario 1: Turn start ─────────────────────────────────────────────────
  test('Scenario 1: Alice starts her turn with 4 action tokens', async ({ page }) => {
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS}`);
  });

  // ── Scenario 2: Initiate a Project ────────────────────────────────────────
  test('Scenario 2: Initiate a Project — costs 2 AP and awards 2 VP', async ({ page }) => {
    // Verify initial state
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS}`);
    await expect(aliceStatus(page)).toContainText('Score: 0');

    // Click the action button (green = available)
    await page.locator('[data-testid="action-btn-createProject"]').click();

    // Wait for the stepper to appear before interacting (Redux state must propagate first)
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Select a compatible hand card and job card
    await selectCompatibleHandAndJobCard(page);

    // Confirm button should now be enabled
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();

    // Confirm
    await page.locator('[data-testid="stepper-next"]').click();

    // Verify outcome: 2 AP spent, 2 VP gained
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST}`);
    await expect(aliceStatus(page)).toContainText(`Score: ${CREATE_PROJECT_VP}`);
  });

  // ── Scenario 3: Recruit Talents ───────────────────────────────────────────
  test('Scenario 3: Recruit Talents — costs 1 AP and places a token on a project', async ({ page }) => {
    // Prerequisite: put a project on the board first (Initiate a Project).
    // Use requireMultipleJobTypes=true so the project will have a second job type for the recruit step.
    await page.locator('[data-testid="action-btn-createProject"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    const ownerJobName = await selectCompatibleHandAndJobCard(page, true);
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Now recruit — wait for action bar to be ready again
    await page.locator('[data-testid="action-btn-recruit"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="action-btn-recruit"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Select a job card and a project slot that are compatible (excluding the owner job)
    await selectCompatibleJobAndProjectSlot(page, ownerJobName);

    // Confirm button must be enabled once both are selected
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Verify: 2 (create) + 1 (recruit) = 3 AP spent → 1 remaining
    await expect(aliceStatus(page)).toContainText(
      `Actions: ${INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST - RECRUIT_COST}`
    );
  });

  // ── Scenario 4: Talent Scouting ──────────────────────────────────────────
  test('Scenario 4: Talent Scouting — costs 1 AP and awards 1 VP', async ({ page }) => {
    await expect(aliceStatus(page)).toContainText('Score: 0');

    // Click Talent Scouting (removeAndRefillJobs)
    await page.locator('[data-testid="action-btn-removeAndRefillJobs"]').click();

    // Wait for stepper to appear (ensures isJobSlotsInteractive is set before clicking)
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Select at least one job card to remove
    await page.locator('[data-testid^="job-card-"]').first().click();

    // Progress message should confirm selection
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select 1 Job Slot');

    await page.locator('[data-testid="stepper-next"]').click();

    // Verify: 1 AP spent, 1 VP gained
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST}`);
    await expect(aliceStatus(page)).toContainText(`Score: ${TALENT_SCOUTING_VP}`);
  });

  // ── Scenario 5: Event card banner ─────────────────────────────────────────
  test('Scenario 5: Event card banner — visible at game start', async ({ page }) => {
    // playEventCard runs in onBegin for Alice's first turn (playOrderPos === 0),
    // so there should always be an event in the slot immediately after load.
    await expect(page.locator('[data-testid="event-card-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-card-banner"]')).toContainText('Event:');
  });

  // ── Scenario 6: Turn indicator ────────────────────────────────────────────
  test('Scenario 6: Turn indicator — non-active players see a waiting alert', async ({ page }) => {
    // While it's Alice's turn, Bob's and Charlie's tabs must show the waiting alert.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await expect(page.locator('[data-testid="waiting-for-player-alert"]')).toBeVisible();

    await page.getByRole('tab', { name: 'Charlie view' }).click();
    await expect(page.locator('[data-testid="waiting-for-player-alert"]')).toBeVisible();

    // Switching back to Alice's tab: her action bar must still be present.
    await page.getByRole('tab', { name: 'Alice view' }).click();
    await expect(page.locator('[data-testid="action-btn-createProject"]')).toBeVisible();
  });

  // ── Scenario 7: endActionTurn ─────────────────────────────────────────────
  test('Scenario 7: endActionTurn — Alice ends early, Bob\'s action bar appears', async ({ page }) => {
    // Alice ends her turn without spending any AP.
    await page.locator('[data-testid="action-btn-endActionTurn"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Confirm End Action Turn');
    await page.locator('[data-testid="stepper-next"]').click();

    // It is now Bob's turn — his action bar must be visible in his tab.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await expect(page.locator('[data-testid="action-btn-createProject"]')).toBeVisible({ timeout: 5000 });
  });

  // ── Scenario 8: contributeOwnedProjects ───────────────────────────────────
  test('Scenario 8: contributeOwnedProjects — costs 1 AP and records contribution', async ({ page }) => {
    // Prerequisite: Alice must have at least one worker token on her own project.
    await page.locator('[data-testid="action-btn-createProject"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    await selectCompatibleHandAndJobCard(page);
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // createProject spent 2 AP → 2 remaining.
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST}`);

    // Open contributeOwnedProjects stepper.
    await page.locator('[data-testid="action-btn-contributeOwnedProjects"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="action-btn-contributeOwnedProjects"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Before any interaction the contribution delta is 0.
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Contribute 0');

    // Increment Alice's first visible worker contribution by 1.
    await page.locator('[data-testid="contribution-increment"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="contribution-increment"]').first().click();

    // Progress must now show 1 point contributed.
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Contribute 1');

    // Confirm should now be enabled.
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Verify: contributeOwnedProjects cost 1 AP → 1 AP remaining.
    await expect(aliceStatus(page)).toContainText(
      `Actions: ${INITIAL_ACTION_TOKENS - CREATE_PROJECT_COST - CONTRIBUTE_OWN_COST}`
    );
  });

  // ── Scenario 9: Doin' Overtime (mirror) ───────────────────────────────────
  test('Scenario 9: Doin\' Overtime (mirror) — repeats a prior 1-AP action', async ({ page }) => {
    // Step A: Alice performs Talent Scouting (removeAndRefillJobs) — 1 AP, 1 VP.
    await page.locator('[data-testid="action-btn-removeAndRefillJobs"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid^="job-card-"]').first().click();
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select 1 Job Slot');
    await page.locator('[data-testid="stepper-next"]').click();

    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST}`);
    await expect(aliceStatus(page)).toContainText(`Score: ${TALENT_SCOUTING_VP}`);

    // Step B: Alice uses mirror to repeat removeAndRefillJobs — 1 AP, 1 more VP.
    await page.locator('[data-testid="action-btn-mirror"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="action-btn-mirror"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Mirror step 0: choose which occupied action to repeat.
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select an action to repeat');
    await page.getByRole('button', { name: 'Remove & Refill Jobs' }).click();
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Repeating: Remove & Refill Jobs');
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Mirror step 1: configure the repeated action (same UX as removeAndRefillJobs).
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid^="job-card-"]').first().click();
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Select 1 Job Slot');
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Verify: 3 AP spent total (1 removeAndRefillJobs + 1 mirror overhead + 1 sub-action), 2 VP earned.
    // Mirror deducts its own cost (1 AP) AND the sub-action deducts its own cost (1 AP).
    await expect(aliceStatus(page)).toContainText(
      `Actions: ${INITIAL_ACTION_TOKENS - TALENT_SCOUTING_COST - MIRROR_COST - TALENT_SCOUTING_COST}`
    );
    await expect(aliceStatus(page)).toContainText(
      `Score: ${TALENT_SCOUTING_VP + TALENT_SCOUTING_VP}`
    );
  });

  // ── Scenario 10: contributeJoinedProjects ─────────────────────────────────
  test('Scenario 10: contributeJoinedProjects — recruit on another player\'s project and contribute', async ({ page }) => {
    // === Round 1 ===
    // Alice: end turn immediately so Bob can create a project.
    await performEndTurn(page);

    // Bob: create a project with 2+ job types so Alice can recruit on it later.
    await page.getByRole('tab', { name: 'Bob view' }).click();
    await waitForActionBarReady(page);
    await page.locator('[data-testid="action-btn-createProject"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    await selectCompatibleHandAndJobCard(page, true); // requireMultipleJobTypes
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();
    await performEndTurn(page);

    // Charlie: end turn (completes round 1).
    await page.getByRole('tab', { name: 'Charlie view' }).click();
    await waitForActionBarReady(page);
    await performEndTurn(page);

    // === Round 2: Alice still goes first (TurnOrder.CUSTOM_FROM re-reads G.playOrder per turn
    // but the cycle position continues from where it left off, so Alice = pos 0 again). ===
    await page.getByRole('tab', { name: 'Alice view' }).click();
    await waitForActionBarReady(page);

    // Alice recruits onto Bob's project (she is NOT the owner).
    await page.locator('[data-testid="action-btn-recruit"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });
    // preferHighRequirement=true ensures Alice recruits onto a job with req>2,
    // so her initial contribution of 2 doesn't fill the slot and she can increment.
    await selectCompatibleJobAndProjectSlot(page, '', true);
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // recruit cost 1 AP → 3 remaining.
    await expect(aliceStatus(page)).toContainText(`Actions: ${INITIAL_ACTION_TOKENS - RECRUIT_COST}`);

    // Alice contributes to the joined project.
    await page.locator('[data-testid="action-btn-contributeJoinedProjects"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="action-btn-contributeJoinedProjects"]').click();
    await page.locator('[data-testid="stepper-progress"]').waitFor({ state: 'visible' });

    // Initial delta is 0.
    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Contribute 0');

    // Increment Alice's contribution on a slot that still has remaining capacity
    // (data-remaining > 0; initial recruit contribution of 2 may fill low-requirement slots).
    const incrementWithRoom = page.locator('[data-testid="contribution-increment"]:not([data-remaining="0"])');
    await incrementWithRoom.first().waitFor({ state: 'visible' });
    await incrementWithRoom.first().click();

    await expect(page.locator('[data-testid="stepper-progress"]')).toContainText('Contribute 1');
    await expect(page.locator('[data-testid="stepper-next"]')).toBeEnabled();
    await page.locator('[data-testid="stepper-next"]').click();

    // Verify: recruit (1) + contributeJoinedProjects (1) = 2 AP spent → 2 remaining.
    await expect(aliceStatus(page)).toContainText(
      `Actions: ${INITIAL_ACTION_TOKENS - RECRUIT_COST - CONTRIBUTE_JOIN_COST}`
    );
  });
});
