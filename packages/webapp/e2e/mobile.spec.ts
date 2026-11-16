/**
 * Mobile smoke tests (390×844 viewport): the bottom-sheet board layout
 * (design: MobileVariantA, Webapp Visual Redesign RFC (#399), PR 4) plus responsive lobby screens.
 */
import { test, expect } from '@playwright/test';
import { closeDevTools, openDevTools } from './devTools';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile layout', () => {
  test('event button leads the strip and opens a dismissible card at 390px', async ({ page }) => {
    await page.goto('/dev?seed=e2e-2');
    const button = page.getByTestId('event-button');
    const card = page.getByTestId('event-card-banner');
    await expect(button).toBeVisible({ timeout: 20000 });
    await expect(button).toHaveCSS('width', '44px');
    await expect(button).toHaveCSS('height', '38px');
    expect(await button.evaluate((element) => element.parentElement?.firstElementChild === element)).toBe(true);
    await expect(card).toHaveCount(0);
    await button.click();
    await expect(card).toBeVisible();
    await expect(card).toContainText('事件 EVENT');
    const art = card.locator('.event-art');
    await expect(art).toHaveCSS('width', '70px');
    await expect(art).toHaveCSS('height', '70px');
    const box = await card.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const artBox = await art.boundingBox();
    const titleBox = await card.getByRole('heading').boundingBox();
    expect(titleBox!.y).toBeGreaterThanOrEqual(artBox!.y + artBox!.height);

    await page.getByRole('button', { name: '知道了' }).click();
    await expect(card).toHaveCount(0);
    await expect(button).toBeFocused();
    await button.click();
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(button).toBeFocused();
    await button.click();
    await page.getByRole('dialog').click({ position: { x: -10, y: -10 } });
    await expect(card).toHaveCount(0);
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('turn queue is horizontal directly under the header at 390px', async ({ page }) => {
    await page.goto('/dev?seed=e2e-2');
    const strip = page.getByTestId('turn-strip');
    const queue = page.getByTestId('turn-queue');
    const current = page.getByTestId('turn-queue-current');
    await expect(current).toBeVisible({ timeout: 20000 });
    await expect(current).toHaveAttribute('data-player-id', '0');
    await expect(queue).toHaveAttribute('aria-label', /^玩家順序：目前 Alice，接著 Bob、Charlie、Alice、Bob、Charlie、Alice$/);
    await expect(current).toHaveCSS('width', '34px');
    const upcoming = page.getByTestId('turn-queue-next');
    await expect(upcoming).toHaveCount(6);
    await expect(upcoming.first()).toHaveCSS('width', '24px');
    await expect(strip).toHaveCSS('flex-direction', 'row');
    expect(await strip.evaluate((element) => element.previousElementSibling?.getAttribute('data-testid'))).toBe('app-header');
    // Entry animations scale dots around their centres; measure settled boxes.
    await queue.evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));
    });
    const currentBox = await current.boundingBox();
    const nextBox = await upcoming.first().boundingBox();
    expect(Math.abs((currentBox!.y + currentBox!.height / 2) - (nextBox!.y + nextBox!.height / 2))).toBeLessThan(1);
    expect(nextBox!.x).toBeGreaterThan(currentBox!.x + currentBox!.width);
    await expect(page.getByRole('button', { name: /專案區往下捲|專案區回到頂端/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('homepage stacks and keeps the Play CTA reachable', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /play online/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/lobby');
    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('lobby stacks create form above open lobbies', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page.getByRole('heading', { name: /create room/i })).toBeVisible();
    await expect(page.getByLabel(/player name/i)).toBeVisible();
  });

  test('board uses the bottom sheet; action-first create works', async ({ page }) => {
    await page.goto('/dev?user=player1&mode=offline');
    const sheet = page.locator('[data-testid="mobile-sheet"]');
    await sheet.waitFor({ state: 'visible', timeout: 20000 });

    const launcher = page.getByTestId('dev-tools-open');
    await expect(launcher).toBeVisible();
    expect(await launcher.boundingBox()).not.toBeNull();
    expect(await sheet.boundingBox()).not.toBeNull();

    await openDevTools(page);
    await expect(page.getByTestId('dev-tools-drawer')).toHaveAttribute('data-anchor', 'bottom');
    await closeDevTools(page);

    // Contextual bar lives in the sheet; hand is collapsed by default
    // (cards stay in a hidden container, so visibility is the signal).
    const handCards = sheet.locator('[data-testid^="hand-card-"]');
    const handle = page.locator('[data-testid="mobile-sheet-handle"]');
    await expect(sheet.locator('[data-testid="context-action"][data-mode="idle"]')).toBeVisible();
    await expect(handle).toHaveAttribute('aria-expanded', 'false');
    await expect(handCards.first()).toBeHidden();

    // The handle expands the hand strip (and collapses it again).
    await handle.click();
    await expect(handle).toHaveAttribute('aria-expanded', 'true');
    await expect(handCards.first()).toBeVisible();
    await handle.click();
    await expect(handle).toHaveAttribute('aria-expanded', 'false');
    await expect(handCards.first()).toBeHidden();
    await handle.click();
    await expect(handCards.first()).toBeVisible();

    // Choose START in the sheet before selecting any cards.
    const panel = sheet.locator('[data-testid="context-action"]:visible');
    await panel.locator('[data-testid="action-createProject"]').click();
    await expect(panel).toHaveAttribute(
      'data-mode',
      'createProject',
    );
    // Cancel returns to idle.
    await panel.locator('[data-testid="ca-cancel"]').click();
    await expect(panel).toHaveAttribute('data-mode', 'idle');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('observer sees the waiting note in the bottom sheet (#478)', async ({ page }) => {
    await page.goto('/dev?user=observer&mode=offline');
    const sheet = page.locator('[data-testid="mobile-sheet"]');
    await sheet.waitFor({ state: 'visible', timeout: 20000 });
    await expect(page.getByTestId('observer-mode-banner')).toBeVisible();

    const waitingAlert = sheet.locator('[data-testid="waiting-for-player-alert"]');
    await expect(waitingAlert).toContainText(/Waiting for Alice/i);
    await expect(waitingAlert).toHaveAttribute('data-pending-discard', 'false');
    await expect(sheet.locator('[data-testid="context-action"]')).toHaveCount(0);
  });

  test('influence ranking stays in the bottom stack as a readable paper card', async ({ page }) => {
    await page.goto('/dev?seed=e2e-2');
    const ranking = page.getByTestId('influence-ranking');
    await expect(ranking).toBeVisible({ timeout: 20000 });
    await ranking.scrollIntoViewIfNeeded();
    await expect(ranking.getByRole('heading', { name: '影響力排行' })).toBeVisible();
    await expect(ranking.getByRole('listitem')).toHaveCount(3);
    await expect(ranking.getByRole('meter')).toHaveCount(6);
    await expect(ranking).toHaveCSS('border-radius', '16px');
    expect(await ranking.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe(await page.evaluate(() => {
        const sample = document.createElement('span');
        sample.style.background = 'var(--paper-2)';
        document.body.append(sample);
        const color = getComputedStyle(sample).backgroundColor;
        sample.remove();
        return color;
      }));
    for (const row of await ranking.getByRole('listitem').all()) {
      const box = await row.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    // The ranking follows the market, outside the action/hand stack.
    expect(await ranking.evaluate((element) => {
      const marketCard = document.querySelector('[data-testid^="job-card-"]');
      return Boolean(marketCard && (marketCard.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(0);
    await expect(page.getByTestId('ranking-row-Bob')).toHaveAttribute('data-actions', '4');
    await expect(page.getByTestId('ranking-row-Bob')).toHaveAttribute('data-you', 'false');
    // Viewer's name: #c53808 on paper-2 (#fbf2e6) is 4.80:1, above WCAG AA 4.5:1 (was #d83d0a, 4.12:1).
    await expect(ranking.getByTitle('Alice')).toHaveCSS('color', 'rgb(197, 56, 8)');
  });

  test('compact header ⋯ menu opens the exit-choice dialog (#420)', async ({ page }) => {
    await page.goto('/dev');
    await page.locator('[data-testid="mobile-sheet"]').waitFor({ state: 'visible', timeout: 20000 });

    await page.locator('[data-testid="header-menu"]').first().click();
    await page.locator('[data-testid="menu-leave"]').first().click();
    await expect(page.locator('[data-testid="exit-dialog"]')).toBeVisible();

    // Cancel closes safely with no navigation or state change.
    await page.locator('[data-testid="exit-cancel"]').click();
    await expect(page.locator('[data-testid="exit-dialog"]')).toHaveCount(0);
    await expect(page).toHaveURL(/\/dev/);
  });
});
