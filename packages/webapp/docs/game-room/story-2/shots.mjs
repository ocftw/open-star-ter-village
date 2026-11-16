/**
 * Real-game sequence; no fixtures, state injection, or server startup:
 * 1. Open /dev?seed=e2e-2 as Alice at 1280×900. Wait for the round-start
 *    decision and acknowledge the intro. Capture the desktop header/game.
 * 2. Resize the SAME match to 390×844, open the ⋯ menu, and capture it.
 * No game moves are needed; setup plays the first event and starts round one.
 * Each shot is also placed beside its matching prototype still. Desktop adds
 * cached Figma Main1.1.1. Comparisons and captures.json carry SHA + plan hash.
 *
 * Requires already-running Next + game server (3000/3001; playwright.config.ts).
 * From the repository root, after the parent commits the candidate:
 * CANDIDATE_SHA=<40-character-candidate-SHA> PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-2/shots.mjs
 * Optional: PLAYWRIGHT_WEB_PORT, PROTOTYPE_CAPTURE_DIR, FIGMA_CAPTURE_PATH.
 * The parent must verify that the running server serves CANDIDATE_SHA.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const figmaPath = process.env.FIGMA_CAPTURE_PATH
  ?? '/workspace/figma-cache/browser-captures/Page 1/main-1-1-1-frame-2.png';
const planHash = 'sha256:09d0ca3a79d851e5535f80de4d360aa1292eb6c0c079cce2e7e02def1e63ea55';
const candidateSHA = process.env.CANDIDATE_SHA;
if (!/^[a-f0-9]{40}$/i.test(candidateSHA ?? '')) {
  throw new Error('Set CANDIDATE_SHA to the committed candidate SHA before capturing.');
}
const [desktopPrototype, mobilePrototype, figma] = await Promise.all([
  readFile(join(prototypes, '02-default-1280.png')),
  readFile(join(prototypes, '82-mobile-390-default.png')),
  readFile(figmaPath),
]);
await mkdir(output, { recursive: true });
const captures = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);

  async function capture(stem, reference, referenceName, desktop = false) {
    await page.evaluate(() => document.fonts.ready);
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    captures.push({
      file: `${stem}.png`, comparison: `${stem}-comparison.png`,
      viewport: page.viewportSize(), url: page.url(),
      round: await page.getByTestId('header-round').innerText(),
      menuOpen: await page.getByRole('menu').isVisible(), reference: referenceName,
    });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; }
        body { margin: 0; width: max-content; background: #fffdf8; color: #2a2422; font: 14px sans-serif; }
        header, figcaption { padding: 12px; }
        main { display: flex; gap: 16px; align-items: start; }
        figure { margin: 0; } img { display: block; }
      </style></head><body><header>Issue #483 · ${stem}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev?seed=e2e-2 · ${page.viewportSize().width}×${page.viewportSize().height}<br>
        Desktop round pill comes from the prototype; Figma has none. Mobile keeps the approved
        icon-only logo, round-only pill and menu; AP stays in the action panel.</header><main>
        <figure><figcaption>Candidate · real game</figcaption><img src="data:image/png;base64,${actual.toString('base64')}"></figure>
        <figure><figcaption>Prototype · ${referenceName}</figcaption><img src="data:image/png;base64,${reference.toString('base64')}"></figure>
        ${desktop ? `<figure><figcaption>Cached Figma · Main1.1.1 (3:789, editor capture)</figcaption><img src="data:image/png;base64,${figma.toString('base64')}"></figure>` : ''}
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
  // Match e2e/devTools.ts: wait for the show-once decision before dismissing.
  await expect(page.locator('[data-game-board]')).toHaveAttribute('data-round-start-ready', 'true');
  const overlay = page.getByTestId('round-start-overlay');
  if (await overlay.isVisible()) {
    await overlay.getByRole('button', { name: '知道了', exact: true }).click();
  }
  await expect(overlay).toHaveCount(0);
  const header = page.getByTestId('app-header');
  await expect(header).toContainText('開源星手村');
  await expect(header.getByTestId('header-round')).toHaveText(/^第 1 輪 · .+/);
  await expect(header.getByRole('link', { name: '規則 RULES' })).toHaveAttribute('target', '_blank');
  await expect(header.getByTestId('header-leave')).toBeVisible();
  await expect(header.locator('[data-testid^="player-status-"]')).toHaveCount(0);
  await capture('app-header-desktop-1280', desktopPrototype, '02-default-1280', true);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(header).not.toContainText('開源星手村');
  await expect(header.getByTestId('header-round')).toHaveText('第 1 輪');
  await header.getByTestId('header-menu').click();
  await expect(page.getByRole('menuitem', { name: /遊戲規則/ })).toBeVisible();
  await expect(page.getByTestId('menu-leave')).toBeVisible();
  await capture('app-header-mobile-390-menu', mobilePrototype, '82-mobile-390-default');

  await writeFile(join(output, 'captures.json'), `${JSON.stringify({ candidateSHA, planHash, captures }, null, 2)}\n`);
  console.log(`Captured two real-game views and comparisons for ${candidateSHA} (${planHash}).`);
} finally {
  await browser.close();
}
