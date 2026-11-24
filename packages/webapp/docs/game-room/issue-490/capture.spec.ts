/**
 * Captures issue #490 screenshots from a production build at /dev?seed=e2e-2.
 * Run: SHOT_DIR=<dir> PLAYWRIGHT_BASE_URL=http://localhost:3510 npx playwright test -c docs/game-room/issue-490/capture.config.ts
 * (the server needs ENABLE_DEV_ROUTE=true). Comparison sheets are made by compose.py.
 */
import { test, expect, Page } from '@playwright/test';
import { dismissRoundStartOverlay, selectDevPerspective } from '../../../e2e/devTools';

const OUT = process.env.SHOT_DIR ?? __dirname;
const ctxAction = (p: Page) => p.locator('[data-testid="context-action"]:visible');
const ready = (p: Page) => p.locator('[data-testid="context-action"][data-mode="idle"]').waitFor({ state: 'visible', timeout: 20000 });

async function createProject(page: Page) {
  await ctxAction(page).locator('[data-testid="action-createProject"]').click();
  const hand = page.locator('[data-testid^="hand-card-"]');
  const jobs = page.locator('[data-testid^="job-card-"]');
  for (let h = 0; h < await hand.count(); h++) {
    const reqs = ((await hand.nth(h).getAttribute('data-requirements')) ?? '').split(',').map((r) => r.trim());
    for (let j = 0; j < await jobs.count(); j++) {
      if (reqs.includes(((await jobs.nth(j).getAttribute('data-job-name')) ?? '').trim())) {
        await hand.nth(h).click();
        await jobs.nth(j).click();
        await ctxAction(page).locator('[data-testid="ca-confirm"]').click();
        await ready(page);
        return;
      }
    }
  }
  throw new Error('no compatible cards');
}

async function endTurn(page: Page) {
  await page.locator('[data-testid="end-turn"]').click();
  await ctxAction(page).locator('[data-testid="ca-confirm"]').click();
}

test('capture', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  await ready(page);
  await page.screenshot({ path: `${OUT}/1280-start.png` });

  await createProject(page);
  await endTurn(page);
  await selectDevPerspective(page, 'player2');
  await ready(page);
  await createProject(page);
  await selectDevPerspective(page, 'player1');
  await expect(page.getByTestId('projects-others').locator('[data-testid^="project-slot-"]')).toHaveCount(1);
  await expect(page.getByTestId('projects-yours').locator('[data-testid^="project-slot-"]')).toHaveCount(1);
  await page.screenshot({ path: `${OUT}/1280-both.png` });

  await page.setViewportSize({ width: 1280, height: 560 });
  await expect(page.getByRole('button', { name: '專案區往下捲' })).toBeVisible();
  await page.screenshot({ path: `${OUT}/1280x560-overflow.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('projects-section').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/390-projects.png` });
});
