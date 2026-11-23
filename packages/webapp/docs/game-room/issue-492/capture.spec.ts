/**
 * Captures issue #492 screenshots from a production build at /dev?seed=e2e-2.
 * Run: SHOT_DIR=<dir> PLAYWRIGHT_BASE_URL=http://localhost:3510 npx playwright test -c docs/game-room/issue-492/capture.config.ts
 * (the game server needs ENABLE_DEV_ROUTE=true). Comparison sheets are made by compose.py.
 */
import { test, expect, Page } from '@playwright/test';
import { dismissRoundStartOverlay, selectDevPerspective } from '../../../e2e/devTools';

const OUT = process.env.SHOT_DIR ?? __dirname;
const ctx = (p: Page) => p.locator('[data-testid="context-action"]:visible');
const ready = (p: Page) => p.locator('[data-testid="context-action"][data-mode="idle"]').waitFor({ state: 'visible', timeout: 20000 });

async function pickCards(page: Page) {
  const hand = page.locator('[data-testid^="hand-card-"]');
  const jobs = page.locator('[data-testid^="job-card-"]');
  for (let h = 0; h < await hand.count(); h++) {
    const reqs = ((await hand.nth(h).getAttribute('data-requirements')) ?? '').split(',').map((r) => r.trim());
    for (let j = 0; j < await jobs.count(); j++) {
      if (reqs.includes(((await jobs.nth(j).getAttribute('data-job-name')) ?? '').trim())) return { hand: hand.nth(h), job: jobs.nth(j) };
    }
  }
  throw new Error('no compatible cards');
}

test('capture', async ({ page }) => {
  test.setTimeout(240000);
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1280, height: 832 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  await ready(page);
  await page.screenshot({ path: `${OUT}/1280-default.png` });

  const projects = page.getByTestId('projects-section');
  const overflowing = () => projects.evaluate((el) => el.scrollHeight > el.clientHeight);
  const who = ['player1', 'player2', 'player3'] as const;
  const createEnabled = () => ctx(page).locator('[data-testid="action-createProject"]').isEnabled();
  for (let turn = 0; turn < 14; turn++) {
    await dismissRoundStartOverlay(page);
    await selectDevPerspective(page, who[turn % 3]);
    await dismissRoundStartOverlay(page);
    await ready(page);
    // Stay on the first turn that overflows and still has AP to start a project.
    if ((await overflowing()) && (await createEnabled())) break;
    for (let n = 0; n < 2 && !(await overflowing()); n++) {
      if (!(await createEnabled())) break;
      await ctx(page).locator('[data-testid="action-createProject"]').click();
      const { hand, job } = await pickCards(page);
      await hand.click();
      await job.click();
      await ctx(page).locator('[data-testid="ca-confirm"]').click();
      await ready(page);
    }
    if ((await overflowing()) && (await createEnabled())) break;
    await page.locator('[data-testid="end-turn"]').click();
    await ctx(page).locator('[data-testid="ca-confirm"]').click();
    // 四大自由 can force a 2-card discard on the round's last player.
    const discard = page.locator('[data-testid="discard-job-cards-panel"]');
    if (await discard.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)) {
      const remove = page.locator('[data-testid^="job-remove-"]');
      await remove.first().click();
      await remove.first().click();
      await page.locator('[data-testid="discard-confirm"]').click();
      await discard.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }
  expect(await overflowing()).toBe(true);
  await page.screenshot({ path: `${OUT}/1280-populated.png` });

  await ctx(page).locator('[data-testid="action-createProject"]').click();
  const { hand } = await pickCards(page);
  await hand.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await page.screenshot({ path: `${OUT}/1280-keyboard-focus.png` });
  await page.keyboard.press('Enter');
  await expect(hand).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(5, 5);
  await page.screenshot({ path: `${OUT}/1280-selected.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  await page.getByTestId('mobile-sheet-handle').click();
  await expect(page.locator('[data-testid^="hand-card-"]').first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/390-handle-open.png` });
});
