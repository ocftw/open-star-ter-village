/**
 * The page header and the turn strip are `position: sticky`. A scroll
 * container on html/body (e.g. `overflow-x: hidden` on both) silently disables
 * that, so this test really scrolls the page and measures.
 */
import { test, expect, type Page } from '@playwright/test';

async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    let previous = window.scrollY;
    let stableSince = performance.now();
    const sample = (now: number) => {
      if (window.scrollY !== previous) {
        previous = window.scrollY;
        stableSince = now;
      }
      if (now - stableSince >= 150) resolve();
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

for (const width of [1024, 1280, 1440]) {
  test(`header and turn strip stay stuck after scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/dev?seed=e2e-2');
    const header = page.getByTestId('app-header');
    const strip = page.getByTestId('turn-strip');
    await expect(page.getByTestId('turn-queue-current')).toBeVisible({ timeout: 20000 });

    // Guarantee the page is scrollable regardless of how short the board is.
    await page.evaluate(() => {
      const filler = document.createElement('div');
      filler.setAttribute('data-testid', 'scroll-filler');
      filler.style.height = '2000px';
      // Grow the grid row (first column) so the strip has room to stick within it.
      document.querySelector('[data-game-board]')?.children[1]?.firstElementChild?.appendChild(filler);
    });

    await page.mouse.move(width / 2, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await settle(page);

    const headerBox = (await header.boundingBox())!;
    const stripBox = (await strip.boundingBox())!;
    expect(Math.abs(headerBox.y)).toBeLessThanOrEqual(1);
    // TurnStrip's sticky offset is the header height plus a 16px gap.
    expect(Math.abs(stripBox.y - (headerBox.height + 16))).toBeLessThanOrEqual(1);
    await expect(page.getByTestId('turn-queue')).toBeInViewport();
    await expect(page.getByTestId('turn-queue-current')).toBeInViewport();
    await expect(page.getByTestId('context-action')).toBeInViewport();
  });
}

for (const width of [320, 390]) {
  test(`board has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/dev?seed=e2e-2');
    await expect(page.getByTestId('turn-queue-current')).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

// `overflow-x: clip` replaced `hidden` on html/body, so confirm nothing leaks sideways.
for (const width of [320, 390]) {
  for (const path of ['/', '/lobby', '/rules']) {
    test(`${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.waitForLoadState('load');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }
}
