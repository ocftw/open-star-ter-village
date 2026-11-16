/**
 * Real-game captures of the sticky header + turn strip after really scrolling
 * the page (no fixtures). /dev?seed=e2e-2, a filler grows the grid row so the
 * page is tall enough to scroll, then the mouse wheel scrolls 600px.
 *
 * Requires Next + game server already running. From packages/webapp:
 * PLAYWRIGHT_WEB_PORT=3420 PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node docs/game-room/story-5/sticky-shots.mjs
 * Writes sticky-after-scroll-1280.png, sticky-after-scroll-1024.png and
 * no-overflow-390.png beside this script.
 */
import { chromium, expect } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const browser = await chromium.launch();
try {
  for (const width of [1280, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 720 }, reducedMotion: 'reduce' });
    await page.goto(`${baseURL}/dev?seed=e2e-2`);
    await expect(page.getByTestId('turn-queue-current')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => {
      const filler = document.createElement('div');
      filler.style.height = '2000px';
      document.querySelector('[data-game-board]')?.children[1]?.firstElementChild?.appendChild(filler);
    });
    await page.mouse.move(width / 2, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.waitForTimeout(500);
    const header = await page.getByTestId('app-header').boundingBox();
    const strip = await page.getByTestId('turn-strip').boundingBox();
    console.log(width, 'scrollY', await page.evaluate(() => window.scrollY), 'header.y', header.y, 'strip.y', strip.y, 'header.h', header.height);
    await page.screenshot({ path: join(output, `sticky-after-scroll-${width}.png`), animations: 'disabled' });
    await page.close();
  }
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await mobile.goto(`${baseURL}/dev?seed=e2e-2`);
  await expect(mobile.getByTestId('turn-queue-current')).toBeVisible({ timeout: 20000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('390 overflow', overflow);
  if (overflow > 0) throw new Error('horizontal overflow at 390');
  await mobile.screenshot({ path: join(output, 'no-overflow-390.png'), animations: 'disabled' });
} finally {
  await browser.close();
}
