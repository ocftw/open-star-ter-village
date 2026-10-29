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
  const rules = await page.locator('#ctl-tree-rules option').evaluateAll(options => options.map(option => option.value));
  for (const rule of rules) {
    await page.selectOption('#ctl-tree-rules', rule);
    const result = await page.evaluate(() => ({ rules: [...new Set(A.scenarios.map(s => s.options.treeRules))], rows: document.querySelectorAll('#all-table tbody tr').length, expectedRows: A.scenarios.filter(s => state.n === 'all' || s.n === state.n).length, gate: A.scenarios.every(s => s.firstAdvancedGateRound.length === s.n), expectedFailed: A.scenarios.reduce((sum, s) => sum + s.failures, 0), failed: Number([...document.querySelectorAll('#facts span')].find(s => s.textContent.startsWith('failed ')).querySelector('b').textContent.replaceAll(',', '')) }));
    assert.deepEqual(result.rules, [rule]);
    assert.equal(result.rows, result.expectedRows);
    assert.equal(result.gate, true);
    assert.equal(result.failed, result.expectedFailed);
  }
  if (process.argv[3]) await page.screenshot({ path: process.argv[3], fullPage: false });
  assert.deepEqual(errors, []);
  console.log('PASS: available tree rules isolate scenario rows and refresh failure counts; no browser errors');
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
