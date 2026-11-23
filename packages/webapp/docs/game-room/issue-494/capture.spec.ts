/**
 * Captures issue #494 screenshots from a production build at /dev?seed=e2e-2.
 * Run: SHOT_DIR=<dir> PLAYWRIGHT_BASE_URL=http://localhost:3520 npx playwright test -c docs/game-room/issue-494/capture.config.ts
 * (the web and game servers need ENABLE_DEV_ROUTE=true). Comparison sheets are made by compose.py.
 */
import { test, expect } from '@playwright/test';
import { dismissRoundStartOverlay } from '../../../e2e/devTools';

const OUT = process.env.SHOT_DIR ?? __dirname;

test('capture 1280', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  await expect(page.getByTestId('job-market')).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: `${OUT}/1280-start.png` });
  await page.getByTestId('job-market').screenshot({ path: `${OUT}/1280-market-start.png` });
  await page.getByTestId('job-market-next').click();
  await expect(page.getByTestId('job-market-prev')).toBeVisible();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/1280-paged.png` });
  await page.getByTestId('job-market').screenshot({ path: `${OUT}/1280-market-paged.png` });
});

test('capture 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  const market = page.getByTestId('job-market');
  await market.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/390-market.png` });
});
