/**
 * Real-game sequence, without fixtures or injected state:
 * /dev?seed=e2e-2 → Alice starts a compatible project, contributes +1,
 * replaces one job (uses her remaining AP; turn ends) → desktop 1280×900.
 * Resize the SAME match to 390×844, scroll to history, capture mobile.
 * This sequence shows round/action/score history; settlement and youth subsidy
 * are covered by unit tests and still require the parent's browser validation.
 *
 * Requires Next + game server already running (ports 3000/3001 by default).
 * This script never starts a server. From the repository root:
 * CANDIDATE_SHA=<40-character-committed-SHA> PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-4/shots.mjs
 * Optional: PLAYWRIGHT_WEB_PORT, PROTOTYPE_CAPTURE_DIR, FIGMA_CAPTURE_PATH.
 * Writes two raw shots and two comparisons beside this script. Comparisons
 * include the matching prototype still and cached Figma Main1.1.1, labelled
 * with the candidate SHA and approved plan hash.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const figmaPath = process.env.FIGMA_CAPTURE_PATH ?? '/workspace/figma-cache/browser-captures/Page 1/main-1-1-1-frame-1.png';
const planHash = 'sha256:4baf3fdca66d12406902ff50a7a70be18e84861b7c1271ae674b69cdce54e9ad';
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  const panel = page.getByTestId('context-action');
  const confirm = panel.getByTestId('ca-confirm');
  const history = page.getByTestId('game-history');
  const list = history.getByRole('list');
  const idle = () => expect(panel).toHaveAttribute('data-mode', 'idle');

  async function createProject() {
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
        await idle();
        await expect(list.getByRole('listitem').filter({ hasText: /^Alice · 發起專案：/ })).toHaveCount(1);
        return;
      }
    }
    throw new Error('Seed e2e-2 did not provide a compatible project and job.');
  }

  async function capture(stem, prototype, referenceName) {
    await page.evaluate(() => document.fonts.ready);
    await expect(history).toBeVisible();
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; } body { margin: 0; width: max-content; background: #fffdf8; color: #2a2422; font: 14px sans-serif; }
        header, figcaption { padding: 12px; } main { display: flex; gap: 16px; align-items: start; } figure { margin: 0; } img { display: block; }
      </style></head><body><header>Issue #485 · ${stem}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev?seed=e2e-2. Moves and influence observed live. Closure/youth browser evidence remains separate.</header><main>
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
  await panel.getByTestId('action-contributeOwnedProjects').click();
  await expect(panel).toHaveAttribute('data-mode', 'contributeOwnedProjects');
  await page.locator('[data-testid^="project-slot-"][data-requirements]').first().click();
  await page.getByTestId('contribution-increment').first().click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await idle();
  await page.getByTestId('refill-jobs').click();
  await expect(panel).toHaveAttribute('data-mode', 'removeAndRefillJobs');
  await page.locator('[data-testid^="job-card-"]').first().click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByTestId('waiting-for-player-alert')).toBeVisible();
  await expect(list.getByRole('listitem').filter({ hasText: 'Alice · 換人力' })).toHaveCount(1);
  // Both score-awarding moves were observed in this mounted session.
  await expect(list.getByRole('listitem').filter({ hasText: /^Alice · 影響力 \+/ })).toHaveCount(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('history-desktop-1280', desktopPrototype, '02-default-1280');
  const desktopEntries = await list.getByRole('listitem').allTextContents();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('mobile-sheet')).toBeVisible();
  await history.scrollIntoViewIfNeeded();
  await expect(list).toHaveCSS('max-height', '180px');
  expect(await list.getByRole('listitem').allTextContents()).toEqual(desktopEntries);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await capture('history-mobile-390', mobilePrototype, '82-mobile-390-default');
  console.log(`Captured two real-game views and their prototype/Figma comparisons in ${output}`);
} finally {
  await browser.close();
}
