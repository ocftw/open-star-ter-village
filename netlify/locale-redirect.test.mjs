import assert from 'node:assert/strict';
import test from 'node:test';

const { default: localeRedirect, preferredLocale } =
  await import('./edge-functions/locale-redirect.mjs');

const request = (path, headers = {}) =>
  new Request(`https://site.test${path}`, { headers });

test('preferredLocale ranks tags by q and matches primary subtags', () => {
  assert.equal(preferredLocale('en-US,en;q=0.9'), 'en');
  assert.equal(preferredLocale('en-US'), 'en');
  assert.equal(preferredLocale('zh-TW,zh;q=0.9,en;q=0.8'), 'zh-Hant');
  assert.equal(preferredLocale('fr;q=1,en;q=0.5,zh;q=0.7'), 'zh-Hant');
  assert.equal(preferredLocale('en;q=0,zh;q=0.1'), 'zh-Hant');
  assert.equal(preferredLocale('en ; q=0.9, fr'), 'en');
  assert.equal(preferredLocale('fr-FR'), undefined);
  assert.equal(preferredLocale(null), undefined);
});

test('redirects English visitors on unprefixed pages, keeping the query', async () => {
  const response = await localeRedirect(
    request('/cards/?ref=webapp', { 'accept-language': 'en-US,en;q=0.9' }),
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), '/en/cards/?ref=webapp');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('passes through Chinese and unknown-language visitors', async () => {
  assert.equal(
    await localeRedirect(
      request('/cards/', { 'accept-language': 'zh-TW,en;q=0.8' }),
    ),
    undefined,
  );
  assert.equal(await localeRedirect(request('/cards/')), undefined);
});

test('honours a valid NEXT_LOCALE cookie over Accept-Language', async () => {
  const headers = {
    'accept-language': 'en',
    cookie: 'a=1; NEXT_LOCALE=zh-Hant',
  };
  assert.equal(await localeRedirect(request('/cards/', headers)), undefined);

  const bogus = { 'accept-language': 'en', cookie: 'NEXT_LOCALE=fr' };
  assert.equal((await localeRedirect(request('/cards/', bogus))).status, 307);
});

test('leaves files alone', async () => {
  const headers = { 'accept-language': 'en' };
  assert.equal(
    await localeRedirect(request('/favicon.ico', headers)),
    undefined,
  );
});

test('leaves locale-prefixed paths alone in any letter case', async () => {
  const headers = { 'accept-language': 'en' };
  for (const path of ['/zh-hant/cards/', '/ZH-HANT/cards/', '/EN/cards/']) {
    assert.equal(await localeRedirect(request(path, headers)), undefined, path);
  }
});
