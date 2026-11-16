/**
 * Real-game capture sequence (no fixtures or injected game state):
 * 1. /dev?seed=e2e-2, Alice's initial turn: desktop zero-score seat-order tie.
 * 2. Alice creates a compatible project (+2, -2 workers: owner + job token), ends; switch to Bob,
 *    scout talent (+1), end; switch to Charlie, scout talent (+1), remain in turn.
 * 3. Capture desktop ranking, then resize the same match to 390 and scroll to it.
 *
 * /dev currently hard-codes THREE players and stub names. These shots cannot
 * prove four-player/long-name browser acceptance; do not label them as such.
 *
 * Start Next (3000) + the game server (3001) separately. This script starts no
 * servers. From the repository root, after the parent commits the candidate:
 * CANDIDATE_SHA="$(git rev-parse HEAD)" PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node packages/webapp/docs/game-room/story-3/shots.mjs
 * PLAYWRIGHT_WEB_PORT and PROTOTYPE_CAPTURE_DIR may override the defaults.
 * Three raw PNGs plus side-by-side prototype comparisons go beside this file.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
const baseURL = `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3000'}`;
const prototypes = process.env.PROTOTYPE_CAPTURE_DIR ?? '/workspace/osv-prototype-capture';
const planHash = 'sha256:fe05262d45f213734c1d0bb3d7b10614587327e7ea6e5bd83cb9b06696768a26';
const candidateSHA = process.env.CANDIDATE_SHA;
if (!/^[a-f0-9]{40}$/i.test(candidateSHA ?? '')) {
  throw new Error('Set CANDIDATE_SHA to the committed candidate SHA before capturing.');
}

// Read references before opening a browser so missing stills fail immediately.
const desktopPrototype = await readFile(join(prototypes, '02-default-1280.png'));
const mobilePrototype = await readFile(join(prototypes, '82-mobile-390-default.png'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  const panel = page.getByTestId('context-action');
  const ranking = page.getByTestId('influence-ranking');
  const confirm = panel.getByTestId('ca-confirm');
  const idle = () => expect(panel).toHaveAttribute('data-mode', 'idle');
  const row = (name) => page.getByTestId(`ranking-row-${name}`);

  async function perspective(name) {
    await page.getByTestId('dev-tools-open').click();
    await page.getByRole('radio', { name: new RegExp(`${name} · Player`, 'i') }).check();
    await page.getByTestId('dev-tools-close').click();
    await expect(page.getByTestId('dev-tools-drawer')).not.toBeVisible();
    await idle();
  }

  async function scout(name) {
    await idle();
    await page.getByTestId('refill-jobs').click();
    await expect(panel).toHaveAttribute('data-mode', 'removeAndRefillJobs');
    await page.locator('[data-testid^="job-card-"]').first().click();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(row(name)).toHaveAttribute('data-score', '1');
    await idle();
  }

  async function endTurn() {
    await page.getByTestId('end-turn').click();
    await expect(panel).toHaveAttribute('data-mode', 'endActionTurn');
    await confirm.click();
    // Only Alice and Bob end in this sequence; neither owes last-seat discards.
    await expect(page.getByTestId('waiting-for-player-alert')).toBeVisible();
  }

  async function createProject() {
    await panel.getByTestId('action-createProject').click();
    await expect(panel).toHaveAttribute('data-mode', 'createProject');
    const handCards = page.locator('[data-testid^="hand-card-"]');
    const jobs = page.locator('[data-testid^="job-card-"]');
    for (const hand of await handCards.all()) {
      const requirements = (await hand.getAttribute('data-requirements') ?? '').split(',').map((name) => name.trim());
      for (const job of await jobs.all()) {
        const jobName = (await job.getAttribute('data-job-name') ?? '').trim();
        if (!requirements.includes(jobName)) continue;
        await hand.click();
        await job.click();
        await expect(confirm).toBeEnabled();
        await confirm.click();
        await expect(row('Alice')).toHaveAttribute('data-score', '2');
        await expect(row('Alice')).toHaveAttribute('data-workers', '10');
        await idle();
        return;
      }
    }
    throw new Error('Seed e2e-2 did not provide Alice a compatible hand card and job.');
  }

  async function capture(stem, prototype, referenceName, description) {
    await page.evaluate(() => document.fonts.ready);
    await expect(ranking).toBeVisible();
    const actual = await page.screenshot({ path: join(output, `${stem}.png`), animations: 'disabled' });
    const comparison = await browser.newPage();
    try {
      await comparison.setContent(`<!doctype html><html><head><style>
        * { box-sizing: border-box; } body { margin: 0; background: #fffdf8; color: #2a2422; font: 14px sans-serif; width: max-content; }
        header { padding: 12px; } main { display: flex; gap: 16px; align-items: start; }
        figure { margin: 0; } figcaption { padding: 12px; } img { display: block; }
      </style></head><body><header>Issue #484 · ${description}<br>Candidate ${candidateSHA}<br>${planHash}<br>
        Real /dev harness: 3 players, default names; four-player/long-name browser evidence remains missing.</header>
      <main><figure><figcaption>Candidate · real game</figcaption><img src="data:image/png;base64,${actual.toString('base64')}"></figure>
      <figure><figcaption>Prototype · ${referenceName}</figcaption><img src="data:image/png;base64,${prototype.toString('base64')}"></figure></main></body></html>`);
      await comparison.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      const size = await comparison.evaluate(() => ({
        width: document.body.scrollWidth, height: document.body.scrollHeight,
      }));
      await comparison.setViewportSize(size);
      await comparison.screenshot({ path: join(output, `${stem}-vs-prototype.png`), fullPage: true });
    } finally {
      await comparison.close();
    }
  }

  await page.goto(`${baseURL}/dev?seed=e2e-2`);
  await idle();
  await expect(ranking.getByRole('listitem')).toHaveCount(3);
  for (const name of ['Alice', 'Bob', 'Charlie']) {
    await expect(row(name)).toHaveAttribute('data-score', '0');
  }
  await capture('ranking-desktop-zero-1280', desktopPrototype, '02-default-1280', 'Zero scores / seat-order tie');
  await createProject();
  await endTurn();
  await perspective('Bob');
  await scout('Bob');
  await endTurn();
  await perspective('Charlie');
  await scout('Charlie');
  expect(await ranking.getByRole('listitem').evaluateAll((rows) => rows.map((item) => item.getAttribute('data-testid'))))
    .toEqual(['ranking-row-Alice', 'ranking-row-Bob', 'ranking-row-Charlie']);
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('ranking-desktop-scores-1280', desktopPrototype, '02-default-1280', 'Scores 2 / 1 / 1; Alice has 10 workers');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('mobile-sheet')).toBeVisible();
  await ranking.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await capture('ranking-mobile-390', mobilePrototype, '82-mobile-390-default', 'Same match, mobile bottom ranking');
  // Tight crop of the mobile ranking card for the viewer-name contrast check.
  await ranking.screenshot({ path: join(output, 'ranking-mobile-390-contrast.png'), animations: 'disabled' });
  console.log(`Captured three real-game states and their prototype comparisons in ${output}`);
  console.log('Missing evidence: four-player / long-name browser case (/dev currently supports only three fixed names).');
} finally {
  await browser.close();
}
