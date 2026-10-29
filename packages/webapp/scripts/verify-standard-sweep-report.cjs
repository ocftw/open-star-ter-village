const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(resolve(process.argv[2] || 'bot-runs/smoke/report.html')).href);
  for (const rule of ['v1', 'v2-collab', 'v2-maintenance']) {
    await page.selectOption('#ctl-tree-rules', rule);
    const result = await page.evaluate(() => ({ rules: [...new Set(A.scenarios.map(s => s.options.treeRules))], rows: document.querySelectorAll('#all-table tbody tr').length, gate: A.scenarios.every(s => s.firstAdvancedGateRound.length === s.n) }));
    assert.deepEqual(result.rules, [rule]);
    assert.equal(result.rows, 72);
    assert.equal(result.gate, true);
  }
  if (process.argv[3]) await page.screenshot({ path: process.argv[3], fullPage: false });
  assert.deepEqual(errors, []);
  console.log('PASS: all 3 tree-rule selections restrict every scenario row; 72 rows at 4p each; no browser errors');
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
