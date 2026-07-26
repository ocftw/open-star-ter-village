/**
 * Mobile smoke tests (390×844 viewport): the bottom-sheet board layout
 * (design: MobileVariantA, RFC #399 PR 4) plus responsive lobby screens.
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

  test('board uses the bottom sheet; tap-driven create works', async ({ page }) => {
    await page.goto('/dev?user=player1&mode=offline');
    const sheet = page.locator('[data-testid="mobile-sheet"]');
    await sheet.waitFor({ state: 'visible', timeout: 20000 });

    const launcher = page.getByTestId('dev-tools-open');
    await expect(launcher).toBeVisible();
    const launcherBox = await launcher.boundingBox();
    const sheetBox = await sheet.boundingBox();
    expect(launcherBox).not.toBeNull();
    expect(sheetBox).not.toBeNull();
    expect(launcherBox!.y + launcherBox!.height).toBeLessThanOrEqual(sheetBox!.y);

    await openDevTools(page);
    await expect(page.getByTestId('dev-tools-drawer')).toHaveAttribute('data-anchor', 'bottom');
    await closeDevTools(page);

    // Contextual bar lives in the sheet; hand is collapsed by default.
    await expect(sheet.locator('[data-testid="context-action"][data-mode="idle"]')).toBeVisible();
    await expect(sheet.locator('[data-testid^="hand-card-"]')).toHaveCount(0);

    // The handle expands the hand strip (and collapses it again).
    await page.locator('[data-testid="mobile-sheet-handle"]').click();
    await expect(sheet.locator('[data-testid^="hand-card-"]').first()).toBeVisible();
    await page.locator('[data-testid="mobile-sheet-handle"]').click();
    await expect(sheet.locator('[data-testid^="hand-card-"]')).toHaveCount(0);
    await page.locator('[data-testid="mobile-sheet-handle"]').click();
    await expect(sheet.locator('[data-testid^="hand-card-"]').first()).toBeVisible();

    // Card-driven create still works on mobile: tap hand card → create mode.
    await sheet.locator('[data-testid^="hand-card-"]').first().click();
    await expect(page.locator('[data-testid="context-action"]')).toHaveAttribute(
      'data-mode',
      'createProject',
    );
    // Cancel returns to idle.
    await page.locator('[data-testid="ca-cancel"]').click();
    await expect(page.locator('[data-testid="context-action"]')).toHaveAttribute('data-mode', 'idle');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
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
