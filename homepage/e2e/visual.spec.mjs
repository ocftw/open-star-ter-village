import { test, expect } from '@playwright/test';
import {
  installDeterministicRendering,
  publicRoutes,
  waitForStablePage,
} from './helpers.mjs';

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  await installDeterministicRendering(page);
});

for (const route of publicRoutes) {
  test(`${route.name} matches its baseline`, async ({ page }) => {
    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBe(route.status);
    await expect(
      page.getByRole('heading', { name: route.text, exact: false }).first(),
    ).toBeVisible();
    await waitForStablePage(page);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
    });
  });
}

test('project card details open in an accessible modal', async ({ page }) => {
  const response = await page.goto('/cards/', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await page.getByRole('button', { name: 'More…' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'Democracy OS' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).not.toBeVisible();
});
