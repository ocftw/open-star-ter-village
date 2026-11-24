/**
 * Run from packages/webapp against the local production servers on 3570/3571.
 * Build with NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3571 pnpm run build.
 * Then run the capture with:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3570 PLAYWRIGHT_GAME_SERVER_PORT=3571 \
 *   PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers pnpm exec playwright test \
 *   -c docs/game-room/issue-496/capture.config.ts slash-refill.capture.spec.ts
 */
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { openWildMatch } from '../../../e2e/slashWildMatch';

test.use({ viewport: { width: 1920, height: 1080 } });

test('capture 斜槓青年 during and after refill', async ({ page, request }) => {
  await openWildMatch(page, request);
  const market = page.getByTestId('job-market');
  const row = market.getByTestId('job-market-row');
  const cards = row.getByTestId(/^job-card-/);
  const remove = row.getByTestId(/^job-remove-/);
  const out = process.env.SHOT_DIR ?? __dirname;
  const expectMarket = async () => {
    await expect(cards).toHaveCount(9);
    await expect(cards.first()).toHaveAttribute('data-wild', 'true');
    await expect(market.getByTestId('job-market-count')).toHaveAttribute('data-count', '8');
    expect(await row.evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(await row.evaluate((el) => el.clientWidth));
  };

  await page.getByTestId('refill-jobs').click();
  await expectMarket();
  await expect(remove).toHaveCount(8);
  await expect(row.getByTestId(/^job-remove-slash-/)).toHaveCount(0);
  await market.screenshot({ path: join(out, '1920-market-slash-refill-entered.png') });

  await remove.first().click();
  await remove.first().click();
  await market.getByTestId('ca-confirm').click();
  await expect(market.getByText('已更換成新人力')).toBeVisible();
  await expectMarket();
  await market.screenshot({ path: join(out, '1920-market-slash-refill-success.png') });
});
