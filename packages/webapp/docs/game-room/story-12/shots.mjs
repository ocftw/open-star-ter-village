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

  const states = ['default', 'focused', 'generalHint', 'change', 'ghost'];
  async function checkTiles(mobile) {
    const signatures = [];
    for (const state of states) {
      const fixture = page.getByTestId(mobile ? 'gallery-mobile' : `gallery-${state}`);
      const tile = fixture.locator(`[data-visual-state="${state}"]`);
      const remove = tile.locator('xpath=..').locator('.job-remove');
      // Prototype .xbtn: only the not-yet-removed (change) tile has the red ×.
      assert.equal(await remove.count(), state === 'change' ? 1 : 0, `${state}: × presence`);
      if (state === 'change') {
        const box = await remove.evaluate((element) => {
          const r = element.getBoundingClientRect();
          const t = element.parentElement.querySelector('.job-tile').getBoundingClientRect();
          const cs = getComputedStyle(element);
          return {
            w: r.width, h: r.height, dx: r.right - t.right, dy: t.top - r.top,
            bg: cs.backgroundColor, label: element.getAttribute('aria-label'),
          };
        });
        assert.equal(box.w, 24);
        assert.equal(box.h, 24);
        assert.equal(box.bg, 'rgb(194, 41, 27)');
        assert(box.dx > 0 && box.dy > 0, 'change: × overlaps the top-right corner');
        assert(box.label.startsWith('移除 '), 'change: × aria-label');
      }
      const measured = await tile.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          viewport: window.innerWidth,
          shadow: style.boxShadow,
          opacity: style.opacity,
          borderStyle: style.borderStyle,
          bg: style.backgroundColor,
          signature: [style.borderStyle, style.borderColor, style.backgroundColor, style.transform, style.boxShadow, style.opacity],
        };
      });
      assert.equal(measured.width, mobile ? 104 : 124, `${state}: card width`);
      assert.equal(measured.height, mobile ? 94 : 106, `${state}: card height`);
      assert(measured.left >= 0 && measured.right <= measured.viewport, `${state}: horizontal overflow`);
      // Flat cards: no sticker shadow anywhere (hint ring is a spread-only teal ring).
      if (state !== 'generalHint') assert.equal(measured.shadow, 'none', `${state}: flat`);
      else assert(/rgba\(30, 166, 185, 0\.35\) 0px 0px 0px 3px/.test(measured.shadow), 'hint: teal ring');
      if (state === 'generalHint') {
        assert.equal(measured.borderStyle, 'solid', 'hint: solid border');
      }
      if (state === 'ghost') {
        assert.equal(measured.borderStyle, 'dashed');
        assert.equal(measured.opacity, '0.7');
      } else if (state === 'change') {
        assert.equal(measured.borderStyle, 'solid');
        assert.equal(measured.opacity, '1');
        assert.equal(measured.bg, 'rgb(255, 250, 243)', 'change: unmuted cream');
      }
      assert.equal(await tile.locator('img').count(), 1, `${state}: character avatar`);
      assert.equal(await tile.getAttribute('data-selected'), state === 'focused' ? 'true' : null);
      signatures.push(JSON.stringify(measured.signature));
    }
    // `change` deliberately shares the default tile body (unmuted); only the red × differs.
    assert.equal(new Set(signatures).size, 4, 'Four distinct tile treatments (change == default body + ×)');
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
  await capture('gallery-change', 'desktop-change.png');
  await capture('gallery-ghost', 'desktop-ghost.png');

  // Zoomed close-up of the remove ×, cropped to the 24px button at deviceScaleFactor 4.
  const zoomPage = await browser.newPage({
    viewport: { width: 1280, height: 832 },
    deviceScaleFactor: 4,
  });
  await zoomPage.goto(`http://127.0.0.1:${port}/dev/card-gallery`);
  await zoomPage.getByTestId('gallery-change').waitFor();
  await zoomPage.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  const removeZoom = zoomPage.getByTestId('gallery-change').locator('.job-remove');
  await removeZoom.screenshot({
    path: fileURLToPath(new URL('x-centring-zoom.png', import.meta.url)),
    animations: 'disabled',
  });
  await zoomPage.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await checkTiles(true);
  const mobile = await page.getByTestId('gallery-mobile').boundingBox();
  assert(mobile && mobile.x >= 0 && mobile.x + mobile.width <= 390, 'Mobile fixtures fit the viewport');
  await capture('gallery-mobile', 'mobile-compact.png');
} finally {
  await browser.close();
}
