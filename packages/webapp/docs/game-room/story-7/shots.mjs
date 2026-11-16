/**
 * Real-game play sequence; no fixtures, state injection or server startup:
 * 1. Open /dev?seed=e2e-2 at 1280×900 and capture the round-one intro.
 * 2. Acknowledge, then end Alice's, Bob's and Charlie's turns through the UI.
 *    Complete the mandatory two-card discard if 四大自由 requires it. Capture
 *    the round-two intro. passStartPlayerToken makes Bob the next starter.
 * 3. Open a fresh /dev?seed=e2e-2 match at 390×844; capture its round-one intro.
 * Each real-game PNG is also placed beside the matching prototype still and
 * cached Figma 回合開始1.1.2 capture in a labelled comparison PNG.
 *
 * Requires already-running Next + game server (3000/3001; playwright.config.ts).
 * From the repository root, after the parent commits the candidate:
 * CANDIDATE_SHA=<40-character-candidate-SHA> PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-7/shots.mjs
 * Optional: PLAYWRIGHT_WEB_PORT, PROTOTYPE_CAPTURE_DIR, FIGMA_CAPTURE_PATH.
 * The parent must verify that the running servers serve CANDIDATE_SHA.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const figmaPath = process.env.FIGMA_CAPTURE_PATH
  ?? '/workspace/figma-cache/browser-captures/Page 1/round-start-1-1-2.png';
const planHash = 'sha256:bf669e7eb3381b7272bbd0345dc7c5a84e677f80e84102b78c730302537fe1a8';
const candidateSHA = process.env.CANDIDATE_SHA;
if (!/^[a-f0-9]{40}$/i.test(candidateSHA ?? '')) {
  throw new Error('Set CANDIDATE_SHA to the committed candidate SHA before capturing.');
}
const [desktopPrototype, mobilePrototype, figma] = await Promise.all([
  readFile(join(prototypes, '01-intro-round-event-1280.png')),
  readFile(join(prototypes, '81-mobile-390-intro.png')),
  readFile(figmaPath),
]);
await mkdir(output, { recursive: true });
const captures = [];
const browser = await chromium.launch();
try {
  async function capture(page, stem, reference, referenceName) {
    await page.evaluate(() => document.fonts.ready);
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    const event = await page.getByTestId('event-card-banner').innerText();
    captures.push({ file: `${stem}.png`, viewport: page.viewportSize(), url: page.url(), event, reference: referenceName });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; }
        body { margin: 0; width: max-content; background: #fffdf8; color: #2a2422; font: 14px sans-serif; }
        header, figcaption { padding: 12px; }
        main { display: flex; gap: 16px; align-items: start; }
        figure { margin: 0; } img { display: block; }
      </style></head><body><header>Issue #488 · ${stem}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev?seed=e2e-2 · ${page.viewportSize().width}×${page.viewportSize().height}<br>
        Chinese round labels follow Figma; event copy comes from the live seed.</header><main>
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

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  desktop.setDefaultTimeout(20000);
  desktop.setDefaultNavigationTimeout(60000);
  await desktop.goto(`${baseURL}/dev?seed=e2e-2`);
  const overlay = desktop.getByTestId('round-start-overlay');
  const title = overlay.getByRole('heading', { level: 1 });
  await expect(title).toHaveText('回合一');
  await expect(title).toHaveCSS('font-size', '64px');
  await expect(title).toHaveCSS('animation-name', 'none');
  await capture(desktop, 'round-start-desktop-1280-round-1', desktopPrototype, '01-intro-round-event-1280');
  await overlay.getByRole('button', { name: '知道了' }).click();
  await expect(overlay).toHaveCount(0);

  const perspectives = [/Alice · Player 1/i, /Bob · Player 2/i, /Charlie · Player 3/i];
  for (const perspective of perspectives) {
    await desktop.getByTestId('dev-tools-open').click();
    await desktop.getByRole('radio', { name: perspective }).check();
    await desktop.getByTestId('dev-tools-close').click();
    const panel = desktop.getByTestId('context-action');
    await expect(panel).toHaveAttribute('data-mode', 'idle');
    const current = desktop.getByTestId('turn-queue-current');
    const previousPlayer = await current.getAttribute('data-player-id');
    await desktop.getByTestId('end-turn').click();
    await expect(panel).toHaveAttribute('data-mode', 'endActionTurn');
    await desktop.getByTestId('ca-confirm').click();
    const discard = desktop.getByTestId('discard-job-cards-panel');
    await expect.poll(async () => (
      await overlay.isVisible() || await discard.isVisible()
      || await current.getAttribute('data-player-id') !== previousPlayer
    )).toBe(true);
    if (await discard.isVisible()) {
      // game.ts endIf blocks the last player until two 四大自由 cards are discarded.
      const jobs = desktop.locator('[data-testid^="job-card-"]');
      await jobs.nth(0).click();
      await jobs.nth(1).click();
      await desktop.getByTestId('discard-confirm').click();
    }
  }
  await expect(title).toHaveText('回合二');
  await expect(desktop.getByTestId('turn-queue-current')).toHaveAttribute('data-player-id', '1');
  await capture(desktop, 'round-start-desktop-1280-round-2', desktopPrototype, '01-intro-round-event-1280');
  await overlay.getByRole('button', { name: '知道了' }).click();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  mobile.setDefaultTimeout(20000);
  mobile.setDefaultNavigationTimeout(60000);
  await mobile.goto(`${baseURL}/dev?seed=e2e-2`);
  const mobileOverlay = mobile.getByTestId('round-start-overlay');
  const mobileTitle = mobileOverlay.getByRole('heading', { level: 1 });
  await expect(mobileTitle).toHaveText('回合一');
  await expect(mobileTitle).toHaveCSS('font-size', '44px');
  await capture(mobile, 'round-start-mobile-390', mobilePrototype, '81-mobile-390-intro');
  await mobileOverlay.getByRole('button', { name: '知道了' }).click();
  await expect(mobileOverlay).toHaveCount(0);

  await writeFile(join(output, 'captures.json'), `${JSON.stringify({ candidateSHA, planHash, captures }, null, 2)}\n`);
  console.log(`Captured three real-game views and comparisons for ${candidateSHA} (${planHash}).`);
} finally {
  await browser.close();
}
