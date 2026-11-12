import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve Playwright through this worktree's pnpm-installed @playwright/test.
const require = createRequire(import.meta.url);
const playwright = require(require.resolve('playwright', {
  paths: [dirname(require.resolve('@playwright/test/package.json'))],
}));
const PORT = process.env.SHOT_PORT || 3391;
const outputDir = fileURLToPath(new URL('.', import.meta.url));
const browser = await playwright.chromium.launch({ executablePath: '/usr/bin/google-chrome' });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${PORT}/dev/card-gallery`, { waitUntil: 'networkidle' });
  await page.getByTestId('gallery-default').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });

  const states = ['default', 'focused', 'generalHint', 'jobHint'];
  async function checkStates(prefix) {
    const treatments = [];
    for (const state of states) {
      const fixture = page.getByTestId(`${prefix}${state}`);
      const card = fixture.locator('[data-visual-state]');
      assert.equal(await card.getAttribute('data-visual-state'), state);
      assert.equal(await card.locator('.project-card__progress-row--hinted').count(), state === 'jobHint' ? 1 : 0);
      treatments.push(await card.evaluate((element) => {
        const style = getComputedStyle(element);
        return JSON.stringify([style.borderStyle, style.borderColor, style.backgroundColor, style.transform]);
      }));
    }
    assert.equal(new Set(treatments).size, 4, 'Each state must have a distinct treatment');
  }

  await checkStates('gallery-');
  await page.getByTestId('gallery-default').screenshot({ path: join(outputDir, 'desktop-default.png'), animations: 'disabled' });
  await page.getByTestId('gallery-focused').screenshot({ path: join(outputDir, 'desktop-focused.png'), animations: 'disabled' });
  await page.getByTestId('gallery-hints').screenshot({ path: join(outputDir, 'desktop-hints.png'), animations: 'disabled' });

  await page.setViewportSize({ width: 390, height: 1200 });
  const mobile = page.getByTestId('gallery-mobile');
  await mobile.waitFor({ state: 'visible' });
  await checkStates('gallery-mobile-');
  const hasOverflow = await mobile.evaluate((gallery) => {
    const cards = Array.from(gallery.querySelectorAll('.project-card'));
    return document.documentElement.scrollWidth > window.innerWidth ||
      gallery.scrollWidth > gallery.clientWidth ||
      cards.some((card) => card.scrollWidth > card.clientWidth || card.getBoundingClientRect().right > window.innerWidth);
  });
  assert.equal(hasOverflow, false, 'Compact cards must not overflow at 390px');
  const spacing = await mobile.locator('.project-card').first().evaluate((card) => ({
    padding: getComputedStyle(card).paddingTop,
    gap: getComputedStyle(card).gap,
  }));
  assert.deepEqual(spacing, { padding: '10px', gap: '8px' });
  await mobile.screenshot({ path: join(outputDir, 'mobile-compact.png'), animations: 'disabled' });
} finally {
  await browser.close();
}
