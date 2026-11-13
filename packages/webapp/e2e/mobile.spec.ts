/**
 * Mobile smoke tests (390×844 viewport): the bottom-sheet board layout
 * (design: MobileVariantA, Webapp Visual Redesign RFC (#399), PR 4) plus responsive lobby screens.
 */
import { test, expect } from '@playwright/test';
import { closeDevTools, openDevTools } from './devTools';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile layout', () => {
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
