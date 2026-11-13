import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as playwright from '../../../node_modules/@playwright/test/index.mjs';

// Run against an already-running local dev server (+ game server); never starts one.
// Works on a clean checkout: every shot comes from the real game screen at /dev?seed=e2e-2
// (no gallery / fixture page).
//   node shots.mjs before   -> before-*.png (baseline build)
//   node shots.mjs after    -> *.png        (this PR)
//
// Seed `e2e-2`, hot-seat /dev. Play sequences and the prototype reference (behaviour.md step):
//  - hand-idle / hand-hover / hand-selected: first hand card, hover, click (selected, no lift).
//      prototype: reference-hand-selected.png (32-handcard-selected), steps 25, 37.
//  - start-market: after selecting a hand card, job tiles the project does not need are
//      data-visual-state="disabled" (opacity .35) -> the disabled JobCard state.
//      prototype: reference-start-market-disabled.png (32b-market-after-handcard), steps 6-9, 12.
//  - refill-ghosts / refill-pushup-mid / refill-after: REFILL, remove 2 tiles, confirm.
//      prototype: reference-refill-pushup.png (19-remove-job-confirm-after), step 18.
//  - dropout-mid / pushup-after-dropout-mid: START with the first hand card + a required job tile,
//      confirm; used tile sinks, refill pushes up. prototype: steps 21/24, 40 (72-release-anim-*).
// NOT reachable on /dev: disabled ProjectCard (board or hand). HandPanel never passes `disabled`
// and BoardGame never passes a board slot visualState; behaviour.md step 29 also "not reached".
// JOIN-mode disabled tiles are not captured (needs another player's started project).
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
} finally {
  await browser.close();
}
