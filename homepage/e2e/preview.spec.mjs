import { test, expect } from '@playwright/test';
import { publicRoutes } from './helpers.mjs';

const monitorFirstPartyFailures = (page, baseURL) => {
  const origin = new URL(baseURL).origin;
  const pageErrors = [];
  const requestFailures = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'unknown failure';
    if (new URL(request.url()).origin === origin) {
      requestFailures.push(`${request.method()} ${request.url()}: ${failure}`);
    } else {
      console.warn(`Third-party request failed: ${request.url()}: ${failure}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      console.warn(`Browser ${message.type()}: ${message.text()}`);
    }
  });

  return { pageErrors, requestFailures };
};

for (const route of publicRoutes) {
  test(`${route.name} is healthy on Netlify`, async ({ page, baseURL }) => {
    const failures = monitorFirstPartyFailures(page, baseURL);
    await page.context().addCookies([
      {
        name: 'NEXT_LOCALE',
        value: route.locale,
        url: new URL('/', baseURL).href,
      },
    ]);
    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBe(route.status);
    await expect(
      page.getByRole('heading', { name: route.text, exact: false }).first(),
    ).toBeVisible();
    expect(failures.pageErrors).toEqual([]);
    expect(failures.requestFailures).toEqual([]);
  });
}

test('Decap CMS shell is healthy on Netlify', async ({ page, baseURL }) => {
  const failures = monitorFirstPartyFailures(page, baseURL);
  const response = await page.goto('/admin/', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(page.locator('#nc-root')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#nc-root')).not.toBeEmpty();
  expect(failures.pageErrors).toEqual([]);
  expect(failures.requestFailures).toEqual([]);
});

test('project card modal is interactive on Netlify', async ({
  page,
  baseURL,
}) => {
  const failures = monitorFirstPartyFailures(page, baseURL);
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
  expect(failures.pageErrors).toEqual([]);
  expect(failures.requestFailures).toEqual([]);
});
