/**
 * E2E tests: Simplified Mode action flow (Scenarios 1–4)
 *
 * Based on the rulebook demo (pages 10–12).
 * The game boots in DevView at localhost:3000.
 * Alice (player 0) always goes first and is the active tab on load.
 * TabPanel only mounts children for the active tab, so there are no duplicate selectors.
 */
import { test, expect, Page } from '@playwright/test';

// ── Constants from the rulebook (Simplified Mode) ────────────────────────────
const INITIAL_ACTION_TOKENS = 4;
const CREATE_PROJECT_COST   = 2;
const RECRUIT_COST          = 1;
const TALENT_SCOUTING_COST  = 1;
const CREATE_PROJECT_VP     = 2;
const TALENT_SCOUTING_VP    = 1;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wait until Alice's ActionBar is visible, meaning the game has initialised and it's her turn. */
async function waitForGameReady(page: Page) {
  await page.locator('[data-testid="action-btn-createProject"]').waitFor({ state: 'visible', timeout: 20000 });
}

/** Alice's player-status block (rendered by PlayerStatus inside UserPanel). */
const aliceStatus = (page: Page) => page.locator('[data-testid="player-status-Alice"]');

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
 */
async function selectCompatibleJobAndProjectSlot(page: Page, ownerJobName: string): Promise<void> {
  const projectSlots = page.locator('[data-testid^="project-slot-"]');
  const jobCards     = page.locator('[data-testid^="job-card-"]');

  const slotCount = await projectSlots.count();
  for (let s = 0; s < slotCount; s++) {
    const slot = projectSlots.nth(s);
    const requirements = await slot.getAttribute('data-requirements');
    if (!requirements) continue;
    // Exclude the job already placed as owner so we don't hit the hasWorker guard
    const reqList = requirements.split(',').map(r => r.trim()).filter(r => r && r !== ownerJobName);
    if (reqList.length === 0) continue;

    const jobCount = await jobCards.count();
    for (let j = 0; j < jobCount; j++) {
      const jobCard  = jobCards.nth(j);
      const jobTitle = (await jobCard.locator('h6').textContent())?.trim() ?? '';
      if (reqList.includes(jobTitle)) {
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
    await page.goto('/');
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

  // ── Scenario 4: Talent Scouting ───────────────────────────────────────────
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
});
