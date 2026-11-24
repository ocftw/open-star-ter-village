import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const DEV_URLS = [
  '/dev',
  '/dev?dev=true',
  '/dev?user=player1&mode=offline',
] as const;

test('serves standalone client assets', async ({ request }) => {
  const response = await request.get('/');
  const scriptPath = (await response.text()).match(
    /<script[^>]+src="([^"]*\/_next\/static\/[^"]+\.js)"/,
  )?.[1];

  expect(scriptPath).toBeTruthy();
  expect((await request.get(scriptPath!)).status()).toBe(200);
});

for (const url of DEV_URLS) {
  test(`${url} returns 404 in production`, async ({ page }) => {
    const response = await page.goto(url);

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('dev-tools-open')).toHaveCount(0);
  });
}

test('the production build excludes test login even with AUTH_TEST_LOGIN enabled', async ({ page, request }) => {
  expect((await request.get('/api/test-login')).status()).toBe(404);
  expect((await request.post('/api/test-login')).status()).toBe(404);
  await page.goto('/sign-in');
  await expect(page.getByRole('button', { name: /test sign in/i })).toHaveCount(0);
});

test('the 390px lobby header keeps the member notice compact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/lobby');
  const header = page.getByTestId('app-header');
  await expect(header.locator('.member-notice-compact')).toBeVisible();
  await expect(header.locator('.member-notice-full')).toBeHidden();
  const box = (await header.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(80);
  const directory = process.env.MEMBER_EVIDENCE_DIR;
  if (directory) {
    await page.screenshot({ path: join(directory, 'lobby-header-mobile.png'), clip: { x: 0, y: 0, width: 390, height: 420 }, animations: 'disabled' });
  }
});
