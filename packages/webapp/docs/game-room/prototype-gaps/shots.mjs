import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as playwright from '../../../node_modules/@playwright/test/index.mjs';

// Run against an already-running local dev server (+ game server); never starts one.
//   node shots.mjs before   -> before-*.png (baseline build)
//   node shots.mjs after    -> *.png        (this PR; also needs the local card gallery)
const mode = process.argv[2] === 'before' ? 'before' : 'after';
const port = process.env.SHOT_PORT || 3493;
const base = `http://127.0.0.1:${port}`;
const out = (name) => fileURLToPath(new URL(`./${mode === 'before' ? 'before-' : ''}${name}.png`, import.meta.url));
mkdirSync(fileURLToPath(new URL('.', import.meta.url)), { recursive: true });

const browser = await playwright.chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const settle = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (i) => i.decode().catch(() => {})));
  });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fresh = async () => {
    await page.goto(`${base}/dev?seed=e2e-2`);
    await page.locator('[data-testid="context-action"][data-mode="idle"]').waitFor({ timeout: 30000 });
    await settle(page);
  };
  const market = page.locator('[data-testid^="job-card-"]').first().locator('xpath=ancestor::div[contains(@style,"grid")][1]');
  const hand = () => page.locator('[data-testid^="hand-card-"]').first();

  // Hand card: idle, hover, selected (no lift), plus START market with disabled tiles.
  await fresh();
  await hand().screenshot({ path: out('hand-idle') });
  await hand().hover();
  await hand().screenshot({ path: out('hand-hover') });
  const idleBox = await hand().boundingBox();
  await hand().click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await settle(page);
  const selBox = await hand().boundingBox();
  if (mode === 'after') assert.equal(selBox.y, idleBox.y, 'selected hand card must not lift');
  else console.log('baseline lift (px):', idleBox.y - selBox.y);
  await hand().screenshot({ path: out('hand-selected') });
  await market.screenshot({ path: out('start-market') });
  if (mode === 'after') {
    const n = await page.locator('[data-visual-state="disabled"]').count();
    assert(n > 0, 'START shows disabled tiles');
    assert.equal(await page.locator('[data-visual-state="disabled"]').first().evaluate((e) => getComputedStyle(e).opacity), '0.35');
  }

  // Refill confirm: grab frames mid push-up.
  await fresh();
  await page.locator('[data-testid="refill-jobs"]').click();
  await page.locator('[data-testid^="job-remove-"]').nth(1).click();
  await page.locator('[data-testid^="job-remove-"]').nth(1).click();
  await market.screenshot({ path: out('refill-ghosts') });
  await page.locator('[data-testid="ca-confirm"]').click();
  await page.waitForTimeout(40);
  await market.screenshot({ path: out('refill-pushup-mid') });
  await page.waitForTimeout(1200);
  await market.screenshot({ path: out('refill-after') });

  // Recruit-style leave: START confirm sinks the used tile, then the refill pushes up.
  await fresh();
  const h = hand();
  const req = ((await h.getAttribute('data-requirements')) ?? '').split(',');
  await h.click();
  await page.locator(`[data-testid^="job-card-"][data-job-name="${req[0]}"]`).first().click();
  await page.locator('[data-testid="ca-confirm"]').click();
  await page.waitForTimeout(200);
  await market.screenshot({ path: out('dropout-mid') });
  await page.waitForTimeout(500);
  await market.screenshot({ path: out('pushup-after-dropout-mid') });

  if (mode === 'after') {
    await page.goto(`${base}/dev/card-gallery`);
    await page.getByTestId('g-board-default').waitFor();
    await settle(page);
    for (const id of ['g-board-default', 'g-board-disabled', 'g-hand-default', 'g-hand-selected', 'g-hand-disabled', 'g-jobs']) {
      await page.getByTestId(id).screenshot({ path: out(id.replace('g-', 'fixture-')) });
    }
    assert.equal(await page.getByTestId('g-board-disabled').locator('.project-card').evaluate((e) => getComputedStyle(e).opacity), '0.35');
  }
} finally {
  await browser.close();
}
