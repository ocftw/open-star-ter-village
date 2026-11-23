/** 人力市場 (#494): badges, persistent REFILL, one-row « » carousel. Real geometry, no faked layout. */
import { test, expect, type Page } from '@playwright/test';
import { dismissRoundStartOverlay, selectDevPerspective } from './devTools';

const scrollLeft = (page: Page) => page.getByTestId('job-market-row').evaluate((el) => el.scrollLeft);

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const parse = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

for (const [width, height, slot] of [[1280, 832, 124], [390, 844, 96]] as const) {
  test.describe(`job market at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/dev?seed=e2e-2');
      await dismissRoundStartOverlay(page);
      await expect(page.getByTestId('job-market')).toBeVisible({ timeout: 20000 });
    });

    test('header, badges, tiles on one line and carousel paging', async ({ page }) => {
      await expect(page.getByTestId('job-market-count')).toHaveText('JOB MARKET · 8 CARDS');
      await expect(page.getByTestId('job-market-count')).toHaveAttribute('data-count', '8');
      await expect(page.getByTestId('job-market-players').locator('.job-market__pdot')).toHaveCount(3);
      await expect(page.getByTestId('job-market-players')).toHaveAttribute('aria-label', /^共用人力市場：.+、.+、.+$/);
      await expect(page.getByTestId('refill-jobs')).toBeVisible();

      const tiles = page.getByTestId('job-market-row').locator('.job-tile-wrap');
      expect(await tiles.count()).toBe(8);
      const boxes = await tiles.evaluateAll((els) => els.map((e) => {
        const r = e.getBoundingClientRect();
        return { top: r.top, width: r.width, height: r.height };
      }));
      expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
      boxes.forEach((b) => expect(Math.round(b.width)).toBe(slot));
      expect(boxes[0].height).toBeGreaterThanOrEqual(width === 1280 ? 106 : 94);

      if (width === 390) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }

      const prev = page.getByTestId('job-market-prev');
      const next = page.getByTestId('job-market-next');
      await expect(next).toBeVisible();
      await expect(prev).toHaveCount(0);
      await expect(next).toHaveAttribute('aria-label', '人力市場往右');

      await next.click();
      await expect.poll(() => scrollLeft(page)).toBeGreaterThan(0);
      await expect(prev).toBeVisible();
      await expect(prev).toHaveAttribute('aria-label', '人力市場往左');

      for (let i = 0; i < 8 && (await next.count()); i++) {
        await next.click();
        await page.waitForTimeout(450);
      }
      await expect(next).toHaveCount(0);
      await expect(prev).toBeVisible();

      for (let i = 0; i < 8 && (await prev.count()); i++) {
        await prev.click();
        await page.waitForTimeout(450);
      }
      await expect(prev).toHaveCount(0);
      expect(await scrollLeft(page)).toBe(0);
    });

    test('reduced motion jumps immediately', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByTestId('job-market-next').click();
      // No smooth scrolling: the very next frame already holds the final position.
      const first = await page.evaluate(() => new Promise<number>((resolve) =>
        requestAnimationFrame(() => resolve(document.querySelector<HTMLElement>('[data-testid="job-market-row"]')!.scrollLeft))));
      await page.waitForTimeout(400);
      expect(first).toBeGreaterThan(0);
      expect(await scrollLeft(page)).toBe(first);
    });

    test('row is keyboard focusable and secondary text meets contrast', async ({ page }) => {
      const row = page.getByTestId('job-market-row');
      await row.focus();
      await expect(row).toBeFocused();
      const { fg, bg } = await page.evaluate(() => ({
        fg: getComputedStyle(document.querySelector('[data-testid="job-market-count"]')!).color,
        bg: getComputedStyle(document.querySelector('[data-testid="job-market"]')!).backgroundColor,
      }));
      const [a, b] = [luminance(parse(fg)), luminance(parse(bg))].sort((x, y) => y - x);
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
    });
  });
}

test('keyboard paging keeps focus when an arrow disappears', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  const next = page.getByTestId('job-market-next');
  await next.focus();
  for (let i = 0; i < 8 && (await next.count()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
  }
  await expect(next).toHaveCount(0);
  await expect(page.getByTestId('job-market-row')).toBeFocused();
});

test('observer has no REFILL but keeps the market', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  await selectDevPerspective(page, 'observer');
  await expect(page.getByTestId('job-market-count')).toHaveText('JOB MARKET · 8 CARDS');
  await expect(page.getByTestId('refill-jobs')).toHaveCount(0);
});

test('1280x832 keeps the bottom row inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 832 });
  await page.goto('/dev?seed=e2e-2');
  await dismissRoundStartOverlay(page);
  const m = await page.evaluate(() => {
    const top = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
    return { rowTop: top('board-bottom-row').top, market: top('job-market').bottom, inner: window.innerHeight };
  });
  expect(m.market).toBeLessThanOrEqual(m.inner);
  const marketBox = await page.getByTestId('job-market').boundingBox();
  expect(marketBox!.height).toBeLessThan(260);
});
