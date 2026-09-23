import { test, expect } from '@playwright/test';

const englishHeaders = { 'Accept-Language': 'en-US,en;q=0.9' };

test('redirects unprefixed deep links to the visitor locale', async ({
  request,
}) => {
  const response = await request.get('/cards/?ref=webapp', {
    headers: englishHeaders,
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers()['location']).toMatch(/\/en\/cards\/\?ref=webapp$/);
});

test('keeps unprefixed deep links for Chinese visitors', async ({
  request,
}) => {
  const response = await request.get('/cards/', {
    headers: { 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
});

test('matches locales the way Next.js does on the root', async ({
  request,
}) => {
  const headers = { 'Accept-Language': 'en-US' };
  const root = await request.get('/', { headers, maxRedirects: 0 });
  const cards = await request.get('/cards/', { headers, maxRedirects: 0 });

  expect(root.status()).toBe(200);
  expect(cards.status()).toBe(200);
});

test('honours the NEXT_LOCALE cookie over Accept-Language', async ({
  request,
}) => {
  const response = await request.get('/cards/', {
    headers: { ...englishHeaders, Cookie: 'NEXT_LOCALE=zh-Hant' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
});

test('language switcher remembers the chosen locale', async ({
  page,
  baseURL,
}) => {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.abort(),
  );
  await page.setExtraHTTPHeaders(englishHeaders);
  await page.goto('/en/cards/');

  await page
    .locator('.dropdown-menu a[href^="/zh-Hant/"]')
    .first()
    .evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/zh-Hant\/cards\/$/);

  const cookies = await page.context().cookies(baseURL);
  expect(cookies.find((cookie) => cookie.name === 'NEXT_LOCALE')?.value).toBe(
    'zh-Hant',
  );

  const response = await page.goto('/cards/');
  expect(new URL(response!.url()).pathname).toBe('/cards/');
});
