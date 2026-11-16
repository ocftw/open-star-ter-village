/**
 * Real-game play sequence (no fixtures, state injection, or started servers):
 * /dev?seed=e2e-2 → Alice starts a compatible project → ends turn → Bob current.
 * Capture desktop 1280×900 mid-round, then resize the SAME match to 390×844
 * and capture the horizontal queue. Back on desktop, Bob starts a project,
 * ends turn, then Charlie starts a third project (two project rows). Capture
 * the visible down button, using a shorter desktop viewport if necessary.
 * Finally exercise down → back-to-top against the real page.
 *
 * Requires Next + game server already running (3000/3001, per playwright.config.ts).
 * Run from repository root:
 * CANDIDATE_SHA=<40-character-candidate-SHA> PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-5/shots.mjs
 * Optional: PLAYWRIGHT_WEB_PORT, PROTOTYPE_CAPTURE_DIR, FIGMA_CAPTURE_PATH.
 * Writes three PNGs and three labelled comparisons with prototype/Figma, beside
 * this script. The parent must verify the running server is on CANDIDATE_SHA.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const figmaPath = process.env.FIGMA_CAPTURE_PATH ?? '/workspace/figma-cache/browser-captures/Page 1/main-1-1-1-frame-1.png';
const planHash = 'sha256:92d1926b0facf58d16e3e76abd5587d199ab11820adfb2dac2f3db243315291b';
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
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  const panel = page.getByTestId('context-action');
  const confirm = panel.getByTestId('ca-confirm');
  const idle = () => expect(panel).toHaveAttribute('data-mode', 'idle');
  const current = page.getByTestId('turn-queue-current');

  // Same developer perspective controls as e2e/devTools.ts; no reload/reset.
  async function perspective(label) {
    await page.getByTestId('dev-tools-open').click();
    await expect(page.getByTestId('dev-tools-drawer')).toBeVisible();
    await page.getByRole('radio', { name: label }).check();
    await page.getByTestId('dev-tools-close').click();
    await expect(page.getByTestId('dev-tools-drawer')).toBeHidden();
    await idle();
  }

  async function createProject() {
    const before = await page.locator('[data-testid^="project-slot-"][data-requirements]').count();
    await panel.getByTestId('action-createProject').click();
    await expect(panel).toHaveAttribute('data-mode', 'createProject');
    for (const hand of await page.locator('[data-testid^="hand-card-"]').all()) {
      const requirements = (await hand.getAttribute('data-requirements') ?? '').split(',').map((name) => name.trim());
      for (const job of await page.locator('[data-testid^="job-card-"]').all()) {
        if (!requirements.includes((await job.getAttribute('data-job-name') ?? '').trim())) continue;
        await hand.click();
        await job.click();
        await expect(confirm).toBeEnabled();
        await confirm.click();
        await expect(page.locator('[data-testid^="project-slot-"][data-requirements]')).toHaveCount(before + 1);
        await idle();
        return;
      }
    }
    throw new Error('Seed e2e-2 did not provide a compatible hand project and market job.');
  }

  async function endTurn(nextPlayer) {
    await panel.getByTestId('end-turn').click();
    await expect(panel).toHaveAttribute('data-mode', 'endActionTurn');
    await confirm.click();
    await expect(current).toHaveAttribute('data-player-id', nextPlayer);
  }

  // Call after observing scroll progress, then wait for a quiet period so the
  // next click cannot interrupt an in-flight smooth scroll (including fallback browsers).
  async function waitForScrollEnd() {
    await page.evaluate(() => new Promise((resolve, reject) => {
      let previous = window.scrollY;
      let stableSince = performance.now();
      const deadline = stableSince + 5000;
      function sample(now) {
        if (window.scrollY !== previous) {
          previous = window.scrollY;
          stableSince = now;
        }
        if (now - stableSince >= 100) resolve();
        else if (now >= deadline) reject(new Error('Page scroll did not settle.'));
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }));
  }

  async function capture(stem, prototype, referenceName) {
    await page.evaluate(() => document.fonts.ready);
    await expect(current).toBeVisible();
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; } body { margin: 0; width: max-content; background: #fffdf8; color: #2a2422; font: 14px sans-serif; }
        header, figcaption { padding: 12px; } main { display: flex; gap: 16px; align-items: start; } figure { margin: 0; } img { display: block; }
      </style></head><body><header>Issue #486 · ${stem}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev?seed=e2e-2 · viewport ${page.viewportSize().width}×${page.viewportSize().height}</header><main>
        <figure><figcaption>Candidate · real game</figcaption><img src="data:image/png;base64,${actual.toString('base64')}"></figure>
        <figure><figcaption>Prototype · ${referenceName}</figcaption><img src="data:image/png;base64,${prototype.toString('base64')}"></figure>
        <figure><figcaption>Cached Figma · Main1.1.1 (editor capture)</figcaption><img src="data:image/png;base64,${figma.toString('base64')}"></figure>
      </main></body></html>`);
      await comparison.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await comparison.setViewportSize(await comparison.evaluate(() => ({ width: document.body.scrollWidth, height: document.body.scrollHeight })));
      await comparison.screenshot({ path: join(output, `${stem}-comparison.png`), fullPage: true });
    } finally {
      await comparison.close();
    }
  }

  await page.goto(`${baseURL}/dev?seed=e2e-2`);
  await idle();
  await createProject();
  await endTurn('1');
  await expect(page.getByTestId('turn-strip')).toHaveCSS('width', '76px');
  await expect(current).toHaveCSS('width', '64px');
  await expect(page.getByTestId('turn-queue-next')).toHaveCount(6);
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('turn-queue-desktop-1280-mid-round', desktopPrototype, '02-default-1280');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(current).toHaveCSS('width', '34px');
  await expect(page.getByTestId('turn-strip')).toHaveCSS('flex-direction', 'row');
  await expect(page.getByTestId('turn-queue-next').first()).toHaveCSS('width', '24px');
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await capture('turn-queue-mobile-390', mobilePrototype, '82-mobile-390-default');

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(current).toHaveCSS('width', '64px');
  await perspective(/Bob · Player 2/i);
  await createProject();
  await endTurn('2');
  await perspective(/Charlie · Player 3/i);
  await createProject();
  const down = page.getByRole('button', { name: '專案區往下捲' });
  for (const height of [900, 720, 640, 520, 480]) {
    await page.setViewportSize({ width: 1280, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    if (await down.isVisible()) break;
  }
  await expect(down).toBeVisible();
  await capture('turn-queue-desktop-1280-overflow', desktopPrototype, '02-default-1280');
  const up = page.getByRole('button', { name: '專案區回到頂端' });
  for (let step = 0; step < 20 && !(await up.isVisible()); step += 1) {
    const before = await page.evaluate(() => window.scrollY);
    await down.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
    await waitForScrollEnd();
  }
  await expect(up).toBeVisible();
  const beforeTop = await page.evaluate(() => window.scrollY);
  await up.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(beforeTop);
  await waitForScrollEnd();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(down).toBeVisible();
  console.log(`Captured three real-game views and comparisons for ${candidateSHA} (${planHash}).`);
} finally {
  await browser.close();
}
