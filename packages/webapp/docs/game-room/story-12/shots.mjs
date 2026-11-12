import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import * as playwright from '../../../node_modules/@playwright/test/index.mjs';

// Run against an already-running local dev server; never starts a server.
const port = process.env.SHOT_PORT || 3393;
const browser = await playwright.chromium.launch({ executablePath: '/usr/bin/google-chrome' });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 832 } });
  await page.goto(`http://127.0.0.1:${port}/dev/card-gallery`);
  await page.getByTestId('gallery-default').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });

  const states = ['default', 'focused', 'generalHint', 'change'];
  async function checkTiles(mobile) {
    const signatures = [];
    for (const state of states) {
      const fixture = page.getByTestId(mobile ? 'gallery-mobile' : `gallery-${state}`);
      const tile = fixture.locator(`[data-visual-state="${state}"]`);
      const measured = await tile.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          viewport: window.innerWidth,
          signature: [style.borderStyle, style.borderColor, style.backgroundColor, style.transform],
        };
      });
      assert.equal(measured.width, mobile ? 104 : 124, `${state}: card width`);
      assert.equal(measured.height, mobile ? 94 : 106, `${state}: card height`);
      assert(measured.left >= 0 && measured.right <= measured.viewport, `${state}: horizontal overflow`);
      assert.equal(await tile.locator('img').count(), 1, `${state}: character avatar`);
      assert.equal(await tile.getAttribute('data-selected'), state === 'focused' ? 'true' : null);
      signatures.push(JSON.stringify(measured.signature));
    }
    assert.equal(new Set(signatures).size, 4, 'All four visual treatments must be distinct');
  }

  async function capture(testId, filename) {
    await page.getByTestId(testId).screenshot({
      path: fileURLToPath(new URL(filename, import.meta.url)),
      animations: 'disabled',
    });
  }

  await checkTiles(false);
  await capture('gallery-default', 'desktop-default.png');
  await capture('gallery-focused', 'desktop-focused.png');
  await capture('gallery-hints', 'desktop-hints.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await checkTiles(true);
  const mobile = await page.getByTestId('gallery-mobile').boundingBox();
  assert(mobile && mobile.x >= 0 && mobile.x + mobile.width <= 390, 'Mobile fixtures fit the viewport');
  await capture('gallery-mobile', 'mobile-compact.png');
} finally {
  await browser.close();
}
