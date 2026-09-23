import { test, expect } from '@playwright/test';
import { installDeterministicRendering } from './helpers';

test('renders the Decap CMS shell', async ({ page }) => {
  await installDeterministicRendering(page);

  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error);
    console.error(error);
  });

  const identityRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('identity.netlify.com')) {
      identityRequests.push(request.url());
    }
  });

  const response = await page.goto('/admin/', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(page.locator('#nc-root')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#nc-root')).not.toBeEmpty();
  expect(pageErrors).toEqual([]);

  // Netlify Identity is retired: auth now goes through GitHub OAuth.
  expect(identityRequests).toEqual([]);
});
