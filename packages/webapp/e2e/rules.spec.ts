import { expect, test } from '@playwright/test';

test('players can open the rules from home and continue to the lobby', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /如何遊玩/ }).click();

  await expect(page).toHaveURL(/\/rules$/);
  await expect(page.getByRole('heading', { name: '每輪怎麼進行' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '完成專案與計分' })).toBeVisible();
  await page.getByRole('link', { name: '開始遊戲 · Play online' }).click();
  await expect(page).toHaveURL(/\/lobby$/);
});

test('rules remain readable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/rules');

  await expect(page.getByRole('heading', { name: '一起玩開源星手村' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '遊戲結束時' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('players can consult the rules without leaving an active game', async ({ page }) => {
  await page.goto('/dev?user=player1&mode=offline');
  await expect(page.getByTestId('header-leave')).toBeVisible();

  const [rulesTab] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('link', { name: /規則 Rules/ }).click(),
  ]);
  await expect(rulesTab).toHaveURL(/\/rules$/);
  await expect(rulesTab.getByRole('heading', { name: '一起玩開源星手村' })).toBeVisible();
  await expect(page).toHaveURL(/\/dev\?user=player1&mode=offline/);
});
