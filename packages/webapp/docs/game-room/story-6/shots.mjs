/**
 * Real-game play sequence (no fixtures, state injection, or started servers):
 * Open /dev?seed=e2e-2 as Alice; capture the desktop strip at 1280×900.
 * Click 事件 EVENT; capture the open card; dismiss with 知道了. Resize the
 * SAME match to 390×844, open the event again, and capture the mobile card.
 * No moves are needed: onBegin draws the first event into G.table.eventSlot.
 *
 * Requires Next + game server already running (3000/3001; playwright.config.ts).
 * From repository root:
 * CANDIDATE_SHA=<40-character-candidate-SHA> PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-6/shots.mjs
 * Optional: PLAYWRIGHT_WEB_PORT, PROTOTYPE_CAPTURE_DIR, FIGMA_CAPTURE_PATH.
 * Writes three real-game PNGs and three labelled comparison PNGs beside this
 * script. Comparisons bind the candidate SHA and approved plan hash. The parent
 * must verify that the already-running server serves that candidate SHA.
 * Prototype 60 and 81 include the round intro title, which belongs to story 7.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const figmaPath = process.env.FIGMA_CAPTURE_PATH
  ?? '/workspace/figma-cache/browser-captures/Page 1/round-start-1-1-2.png';
const planHash = 'sha256:e8278208f6e2ae4a930c69bc29fba101d7082bb793a7ebe3371b1081de19e84f';
const candidateSHA = process.env.CANDIDATE_SHA;
if (!/^[a-f0-9]{40}$/i.test(candidateSHA ?? '')) {
  throw new Error('Set CANDIDATE_SHA to the committed candidate SHA before capturing.');
}
const [desktopPrototype, mobilePrototype, figma] = await Promise.all([
  readFile(join(prototypes, '60-fourfreedoms-event-card-1280.png')),
  readFile(join(prototypes, '81-mobile-390-intro.png')),
  readFile(figmaPath),
]);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  const button = page.getByTestId('event-button');
  const card = page.getByTestId('event-card-banner');

  async function capture(stem, reference, referenceName) {
    await page.evaluate(() => document.fonts.ready);
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; }
        body { margin: 0; width: max-content; background: #fffdf8; color: #2a2422; font: 14px sans-serif; }
        header, figcaption { padding: 12px; }
        main { display: flex; gap: 16px; align-items: start; }
        figure { margin: 0; } img { display: block; }
      </style></head><body><header>Issue #487 · ${stem}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev?seed=e2e-2 · ${page.viewportSize().width}×${page.viewportSize().height}<br>
        Prototype intro title is story 7; this story opens the card on request. Event copy comes from the live seed.</header><main>
        <figure><figcaption>Candidate · real game</figcaption><img src="data:image/png;base64,${actual.toString('base64')}"></figure>
        <figure><figcaption>Prototype · ${referenceName}</figcaption><img src="data:image/png;base64,${reference.toString('base64')}"></figure>
        <figure><figcaption>Cached Figma · 回合開始1.1.2 (editor capture)</figcaption><img src="data:image/png;base64,${figma.toString('base64')}"></figure>
      </main></body></html>`);
      await comparison.locator('img').evaluateAll((images) => Promise.all(images.map((img) => img.decode())));
      await comparison.setViewportSize(await comparison.evaluate(() => ({
        width: document.body.scrollWidth, height: document.body.scrollHeight,
      })));
      await comparison.screenshot({ path: join(output, `${stem}-comparison.png`), fullPage: true });
    } finally {
      await comparison.close();
    }
  }

  await page.goto(`${baseURL}/dev?seed=e2e-2`);
  await expect(page.getByTestId('context-action')).toHaveAttribute('data-mode', 'idle');
  await expect(button).toBeVisible();
  await expect(button).toHaveCSS('width', '56px');
  await expect(button).toHaveCSS('height', '56px');
  await expect(card).toHaveCount(0);
  await capture('event-button-desktop-1280', desktopPrototype, '60-fourfreedoms-event-card-1280');

  await button.click();
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).not.toBeEmpty();
  await expect(card.locator('p')).not.toBeEmpty();
  // Verify the native modal keeps keyboard focus inside the one-button card.
  const acknowledge = page.getByRole('button', { name: '知道了' });
  await expect(acknowledge).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(acknowledge).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(acknowledge).toBeFocused();
  await capture('event-card-desktop-1280', desktopPrototype, '60-fourfreedoms-event-card-1280');
  await acknowledge.click();
  await expect(card).toHaveCount(0);
  await expect(button).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(button).toHaveCSS('width', '44px');
  await expect(button).toHaveCSS('height', '38px');
  await expect(page.getByTestId('turn-strip')).toHaveCSS('flex-direction', 'row');
  await button.click();
  await expect(card).toBeVisible();
  await capture('event-card-mobile-390', mobilePrototype, '81-mobile-390-intro');
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(button).toBeFocused();
  console.log(`Captured three real-game views and comparisons for ${candidateSHA} (${planHash}).`);
} finally {
  await browser.close();
}
