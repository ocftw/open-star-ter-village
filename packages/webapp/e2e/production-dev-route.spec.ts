import { expect, test } from '@playwright/test';

const DEV_URLS = [
  '/dev',
  '/dev?dev=true',
  '/dev?user=player1&mode=offline',
] as const;

for (const url of DEV_URLS) {
  test(`${url} returns 404 in production`, async ({ page }) => {
    const response = await page.goto(url);

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('dev-tools-open')).toHaveCount(0);
  });
}
