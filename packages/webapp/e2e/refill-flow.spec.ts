/**
 * 換人力 refill flow (#496): hidden-until-confirm, then empty slots → survivors
 * slide left → one-at-a-time deal at the rightmost slot → toast. Real browser,
 * real geometry; a MutationObserver watches the market for the whole run.
 */
import { test, expect, type Page } from '@playwright/test';
import { dismissRoundStartOverlay } from './devTools';
import { openWildMatch } from './slashWildMatch';

type LogEntry = { t: number; kind: string; id: string; phase: string | null; confirmed: boolean };

async function observe(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    const market = document.querySelector('[data-testid="job-market"]')!;
    const initial = new Set(Array.from(market.querySelectorAll('[data-testid^="job-card-"]')).map((e) => (e as HTMLElement).dataset.testid));
    const log: unknown[] = [];
    w.__refillLog = log;
    w.__confirmed = false;
    const note = (kind: string, id: string) =>
      log.push({ t: performance.now(), kind, id, phase: (market as HTMLElement).dataset.refillPhase ?? null, confirmed: w.__confirmed });
    const scan = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      const cards = node.matches('[data-testid^="job-card-"]') ? [node] : Array.from(node.querySelectorAll<HTMLElement>('[data-testid^="job-card-"]'));
      cards.forEach((c) => { if (!initial.has(c.dataset.testid!)) note('new-card', c.dataset.testid!); });
      if (node.matches('[data-testid="job-slot-empty"]') || node.querySelector('[data-testid="job-slot-empty"]')) note('empty-slot', '');
      if (node.matches('[data-motion]') || node.querySelector('[data-motion]')) note('motion', node.getAttribute('data-motion') ?? '');
    };
    new MutationObserver((records) => {
      records.forEach((r) => {
        r.addedNodes.forEach(scan);
        if (r.type === 'attributes' && r.target instanceof HTMLElement && r.attributeName === 'data-motion') note('motion', r.target.getAttribute('data-motion') ?? '');
        if (r.type === 'attributes' && r.attributeName === 'data-visual-state' && (r.target as HTMLElement).dataset.visualState === 'default') return;
      });
      // Anything visible-but-unknown (a count hint or entering back) would be text: guard on the section.
      if (/CARDS?\b/.test(market.textContent ?? '') && !/JOB MARKET · \d+ CARDS/.test(market.textContent ?? '')) note('count-hint', '');
    }).observe(market, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-motion'] });
  });
}
const log = (page: Page) => page.evaluate(() => (window as unknown as { __refillLog: LogEntry[] }).__refillLog);
const markConfirmed = (page: Page) => page.evaluate(() => { (window as unknown as { __confirmed: boolean }).__confirmed = true; });
const rowIds = (page: Page) =>
  page.getByTestId('job-market-row').locator('.job-tile-wrap, .job-slot-empty').evaluateAll((els) =>
    els.map((e) => (e as HTMLElement).dataset.jobId ?? 'EMPTY'));
const cardIds = (page: Page) => rowIds(page).then((ids) => ids.filter((id) => id !== 'EMPTY'));
const ap = async (page: Page) => Number(await page.getByTestId('ranking-row-Alice').getAttribute('data-actions'));

for (const [width, height] of [[1280, 832], [390, 844]] as const) {
  test.describe(`refill flow at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/dev?seed=e2e-2');
      await dismissRoundStartOverlay(page);
      await expect(page.getByTestId('job-market')).toBeVisible({ timeout: 20000 });
      await observe(page);
    });

    test('entering shows × only: REFILL inactive, CANCEL on, DONE off, one ca-confirm in the header', async ({ page }) => {
      await page.getByTestId('refill-jobs').click();
      const actions = page.getByTestId('job-market-actions');
      await expect(page.getByTestId('ca-confirm')).toHaveCount(1);
      await expect(actions.getByTestId('ca-confirm')).toBeDisabled();
      await expect(actions.getByTestId('refill-cancel')).toBeEnabled();
      await expect(page.getByTestId('refill-jobs')).toBeDisabled();
      await expect(page.getByTestId('ca-cancel')).toBeVisible();
      expect((await page.locator('.job-remove').count())).toBe(8);
      const box = await page.locator('.job-remove').first().boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(await log(page)).toEqual([]);
    });

    test('mouse + keyboard removal, ghosts, count, and both cancels restore with nothing revealed', async ({ page }) => {
      const before = await cardIds(page);
      const startAp = await ap(page);
      for (const cancel of ['refill-cancel', 'ca-cancel']) {
        await page.getByTestId('refill-jobs').click();
        await page.locator('.job-remove').first().click();
        await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(1);
        await page.locator('.job-remove').first().focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(2);
        await expect(page.getByTestId('job-market-count')).toHaveText('JOB MARKET · 8 CARDS');
        await expect(page.getByTestId('ca-confirm')).toBeEnabled();
        await page.getByTestId(cancel).click();
        await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(0);
        await expect(page.getByTestId('refill-jobs')).toBeEnabled();
        expect(await cardIds(page)).toEqual(before);
        expect(await ap(page)).toBe(startAp);
      }
      expect(await log(page)).toEqual([]);
    });

    test('accepted confirm: one dispatch, empty slots, left-shift, one-at-a-time deal, toast last', async ({ page }) => {
      const before = await cardIds(page);
      const startAp = await ap(page);
      await page.evaluate(() => {
        const w = window as unknown as Record<string, unknown>;
        const survivorsLeft: Record<string, number[]> = {};
        const marks: { t: number; what: string }[] = [];
        w.__survivorsLeft = survivorsLeft;
        w.__marks = marks;
        const tick = () => {
          document.querySelectorAll<HTMLElement>('.job-tile-wrap[data-job-id]').forEach((el) => {
            (survivorsLeft[el.dataset.jobId!] ??= []).push(el.offsetLeft);
          });
          if (document.querySelector('[data-testid="job-slot-empty"]')) marks.push({ t: performance.now(), what: 'empty-present' });
          if (document.querySelector('.job-tile-wrap[data-motion="deal"]')) marks.push({ t: performance.now(), what: 'flying' });
          if (document.body.textContent?.includes('已更換成新人力')) marks.push({ t: performance.now(), what: 'toast' });
          requestAnimationFrame(tick);
        };
        tick();
      });
      await page.getByTestId('refill-jobs').click();
      const removed = before.slice(1, 3);
      for (const id of removed) await page.getByTestId(`job-remove-${id}`).click();
      await expect(page.locator('[data-visual-state="ghost"]')).toHaveCount(2);
      await markConfirmed(page);
      await page.getByTestId('ca-confirm').click();

      // Exactly one move: AP drops once and the score gains once.
      await expect.poll(() => ap(page), { timeout: 10_000 }).toBe(startAp - 1);
      await expect(page.getByTestId('score-popup')).toHaveText('影響力+1');
      await expect(page.getByTestId('ranking-row-Alice')).toHaveAttribute('data-score', '1');
      await expect(page.getByText('已更換成新人力')).toBeVisible({ timeout: 10_000 });

      const survivors = before.filter((id) => !removed.includes(id));
      const final = await cardIds(page);
      expect(final.slice(0, survivors.length)).toEqual(survivors);
      expect(final).toHaveLength(8);
      expect(final.slice(survivors.length).some((id) => before.includes(id))).toBe(false);

      const entries = await log(page);
      // Incoming faces only ever mounted after the confirm click, during the deal.
      const news = entries.filter((e) => e.kind === 'new-card');
      expect(news).toHaveLength(2);
      news.forEach((e) => { expect(e.confirmed).toBe(true); expect(e.phase).toBe('dealing'); });
      expect(news[1].t - news[0].t).toBeGreaterThanOrEqual(300); // one at a time, staggered
      expect(entries.some((e) => e.kind === 'count-hint')).toBe(false);
      expect(entries.some((e) => e.kind === 'motion' && e.id === 'push-in')).toBe(false);

      const w = await page.evaluate(() => {
        const win = window as unknown as { __survivorsLeft: Record<string, number[]>; __marks: { t: number; what: string }[] };
        return { __survivorsLeft: win.__survivorsLeft, __marks: win.__marks };
      });
      expect(w.__marks.some((m) => m.what === 'empty-present')).toBe(true);
      // Survivors only ever move left (layout position, never pushed right by a new card).
      survivors.forEach((id) => {
        const xs = w.__survivorsLeft[id];
        for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeLessThanOrEqual(xs[i - 1] + 0.5);
      });
      const lastFlying = Math.max(...w.__marks.filter((m) => m.what === 'flying').map((m) => m.t));
      const firstToast = Math.min(...w.__marks.filter((m) => m.what === 'toast').map((m) => m.t));
      expect(firstToast).toBeGreaterThanOrEqual(lastFlying);

      // The flight starts from the header edge (above the slot), and is not a bottom-up push.
      const animation = await page.evaluate(() => {
        const css = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules)).map((r) => r.cssText).join('\n');
        return { deal: /refill-deal/.test(css), pushUp: /pushUp/.test(css) };
      });
      expect(animation).toEqual({ deal: true, pushUp: false });
    });

    test('reduced motion: faces appear in place only after the accepted confirm, same final order', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const before = await cardIds(page);
      await page.getByTestId('refill-jobs').click();
      const removed = before.slice(1, 3);
      for (const id of removed) await page.getByTestId(`job-remove-${id}`).click();
      await markConfirmed(page);
      await page.getByTestId('ca-confirm').click();
      await expect(page.getByText('已更換成新人力')).toBeVisible({ timeout: 10_000 });
      const survivors = before.filter((id) => !removed.includes(id));
      const final = await cardIds(page);
      expect(final.slice(0, survivors.length)).toEqual(survivors);
      const entries = await log(page);
      entries.filter((e) => e.kind === 'new-card').forEach((e) => expect(e.confirmed).toBe(true));
      expect(entries.some((e) => e.kind === 'motion' || e.kind === 'empty-slot' || e.kind === 'count-hint')).toBe(false);
      await expect(page.locator('.job-tile-wrap[data-motion]')).toHaveCount(0);
    });
  });
}

test('refill deals only real cards while 斜槓青年 stays first until the turn ends', async ({ page, request }) => {
  await openWildMatch(page, request);
  const market = page.getByTestId('job-market');
  const count = page.getByTestId('job-market-count');
  const wild = market.locator('[data-wild="true"]');
  await expect(wild).toBeVisible();
  const [wildId, ...realIds] = await cardIds(page);
  expect(wildId).toMatch(/^slash-0-/);
  expect(realIds).toHaveLength(8);
  await observe(page);

  await page.getByTestId('refill-jobs').click();
  await expect(market.getByTestId(`job-remove-${wildId}`)).toHaveCount(0);
  await expect(market.getByTestId(/^job-remove-/)).toHaveCount(8);
  for (const id of realIds.slice(0, 2)) await market.getByTestId(`job-remove-${id}`).click();
  await expect(wild).toHaveAttribute('data-visual-state', 'change');
  await markConfirmed(page);
  await market.getByTestId('ca-confirm').click();

  await expect(page.getByTestId('score-popup')).toHaveText('影響力+1');
  await expect(market).toHaveAttribute('data-refill-phase', 'dealing');
  await expect(count).toHaveAttribute('data-count', '8');
  await expect(wild).not.toHaveAttribute('data-motion', /.*/);
  expect((await rowIds(page))[0]).toBe(wildId);
  await expect(page.getByText('已更換成新人力')).toBeVisible();

  const final = await cardIds(page);
  expect(final).toHaveLength(9);
  expect(final.slice(0, 7)).toEqual([wildId, ...realIds.slice(2)]);
  const entries = await log(page);
  expect(entries.filter((entry) => entry.kind === 'new-card').map(({ id }) => id))
    .toEqual(final.slice(7).map((id) => `job-card-${id}`));

  await page.getByTestId('end-turn').click();
  await page.getByTestId('ca-confirm').click();
  await expect(wild).toHaveCount(0);
  expect(await rowIds(page)).toEqual(final.slice(1));
  await expect(count).toHaveAttribute('data-count', '8');
  await expect(market).not.toHaveAttribute('data-refill-phase', /.*/);
  expect((await log(page)).slice(entries.length)).toEqual([]);
});
