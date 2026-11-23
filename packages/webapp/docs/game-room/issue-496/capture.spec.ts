/**
 * Captures issue #496 screenshots from a production build at /dev?seed=e2e-2.
 * Run: SHOT_DIR=<dir> PLAYWRIGHT_BASE_URL=http://localhost:3532 npx playwright test -c docs/game-room/issue-496/capture.config.ts
 * (the web and game servers need ENABLE_DEV_ROUTE=true). Comparison sheets are made by compose.py.
 * Deal frames are taken by waiting for the market's data-refill-phase, so they are real frames, not mocks.
 */
import { test, expect, type Page } from '@playwright/test';
import { dismissRoundStartOverlay } from '../../../e2e/devTools';

const OUT = process.env.SHOT_DIR ?? __dirname;

for (const [width, height] of [[1280, 832], [390, 844]] as const) {
  test(`capture ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/dev?seed=e2e-2');
    await dismissRoundStartOverlay(page);
    const market = page.getByTestId('job-market');
    await expect(market).toBeVisible({ timeout: 20000 });
    const shot = async (name: string) => {
      await page.screenshot({ path: `${OUT}/${width}-${name}.png` });
      await market.screenshot({ path: `${OUT}/${width}-market-${name}.png` });
    };
    const focusMarket = async () => {
      await market.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
    };

    await focusMarket();
    await shot('1-idle');

    await page.getByTestId('refill-jobs').click();
    await expect(page.locator('.job-remove').first()).toBeVisible();
    await page.mouse.move(0, 0);
    await focusMarket();
    await shot('2-entered');

    const ids = await page.locator('[data-testid^="job-card-"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.testid!.replace('job-card-', '')));
    await page.getByTestId(`job-remove-${ids[1]}`).click();
    await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(1);
    await focusMarket();
    await shot('3-first-ghost');

    await page.getByTestId('refill-cancel').click();
    await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(0);
    await focusMarket();
    await shot('4-cancel');

    await page.getByTestId('refill-jobs').click();
    await page.getByTestId(`job-remove-${ids[1]}`).click();
    await page.getByTestId(`job-remove-${ids[2]}`).click();
    await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(2);
    await page.getByTestId('ca-confirm').click();
    const phase = async (name: string) => {
      await page.waitForSelector(`[data-testid="job-market"][data-refill-phase="${name}"]`, { timeout: 10000 });
    };
    await phase('shifting');
    await shot('5-confirm-empty-slots');
    await phase('dealing');
    await page.waitForTimeout(150);
    await shot('6-deal-mid-frame');
    await expect(page.getByText('已更換成新人力')).toBeVisible({ timeout: 10000 });
    await shot('7-success');
  });
}
