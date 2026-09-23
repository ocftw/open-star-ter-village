import { test, expect } from '@playwright/test';

// Locale detection on deep links is a Netlify Edge Function
// (netlify/edge-functions/locale-redirect.mjs), so this spec only runs in the
// Netlify preview smoke.

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

test('matches locales the way the root redirect does', async ({ request }) => {
  const headers = { 'Accept-Language': 'en-US' };
  const root = await request.get('/', { headers, maxRedirects: 0 });
  const cards = await request.get('/cards/', { headers, maxRedirects: 0 });

  expect(new URL(root.headers()['location'], root.url()).pathname).toBe('/en/');
  expect(new URL(cards.headers()['location'], cards.url()).pathname).toBe(
    '/en/cards/',
  );
});

test('leaves explicitly prefixed paths alone', async ({ request }) => {
  const response = await request.get('/zh-Hant/cards/', {
    headers: englishHeaders,
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
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
