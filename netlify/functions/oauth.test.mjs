import assert from 'node:assert/strict';
import test, { before } from 'node:test';

before(() => {
  process.env.GITHUB_CLIENT_ID = 'Ov23test';
  process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
  process.env.OAUTH_STATE_SECRET = 'test-state-secret';
});

const { createState, clearStateCookie, verifyState } =
  await import('./_oauth-state.mjs');
const { default: callback } = await import('./callback.mjs');
const { default: auth } = await import('./auth.mjs');

const CALLBACK_URL = 'https://site.test/.netlify/functions/callback';

/** A request carrying a matching state cookie and query parameter. */
const validRequest = (code = 'abc123') => {
  const { state, cookie } = createState();
  return new Request(`${CALLBACK_URL}?code=${code}&state=${state}`, {
    headers: { cookie: cookie.split(';')[0] },
  });
};

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const withFetch = async (impl, fn) => {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
};

const isErrorPage = (body) => body.includes('authorization:github:error');

// --------------------------------------------------------------- CSRF state

test('accepts a state that matches its signed cookie', () => {
  const { state, cookie } = createState();
  assert.equal(verifyState(cookie.split(';')[0], state), true);
});

test('rejects a mismatched, absent, or unsigned state', () => {
  const { state, cookie } = createState();
  const header = cookie.split(';')[0];
  assert.equal(verifyState(header, 'deadbeef'), false);
  assert.equal(verifyState(header, null), false);
  assert.equal(verifyState(null, state), false);
  assert.equal(verifyState(`osv_oauth_state=${state}`, state), false);
});

test('rejects a forged signature', () => {
  const { state } = createState();
  assert.equal(
    verifyState(`osv_oauth_state=${state}.${'0'.repeat(64)}`, state),
    false,
  );
});

test('state is unguessable and single-use', () => {
  const a = createState();
  const b = createState();
  assert.notEqual(a.state, b.state);
  assert.match(a.state, /^[0-9a-f]{64}$/);
  assert.match(clearStateCookie(), /Max-Age=0/);
});

test('state cookie is HttpOnly, Secure and SameSite=Lax', () => {
  const { cookie } = createState();
  for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) {
    assert.ok(cookie.includes(attr), `missing ${attr}`);
  }
});

// --------------------------------------------------------------- auth leg

test('auth redirects to GitHub with least-privilege scope', async () => {
  const res = await auth(
    new Request('https://site.test/.netlify/functions/auth'),
  );
  assert.equal(res.status, 302);
  const url = new URL(res.headers.get('location'));
  assert.equal(
    url.origin + url.pathname,
    'https://github.com/login/oauth/authorize',
  );
  assert.equal(url.searchParams.get('scope'), 'public_repo');
  assert.equal(url.searchParams.get('redirect_uri'), CALLBACK_URL);
  assert.equal(url.searchParams.get('state').length, 64);
  assert.match(res.headers.get('set-cookie'), /HttpOnly/);
});

test('auth fails closed when configuration is missing', async () => {
  const saved = process.env.GITHUB_CLIENT_ID;
  delete process.env.GITHUB_CLIENT_ID;
  try {
    const res = await auth(
      new Request('https://site.test/.netlify/functions/auth'),
    );
    assert.equal(res.status, 500);
    assert.match(await res.text(), /GITHUB_CLIENT_ID/);
  } finally {
    process.env.GITHUB_CLIENT_ID = saved;
  }
});

// --------------------------------------------------------------- callback leg

test('callback exchanges a valid code for a token', async () => {
  const res = await withFetch(
    () => jsonResponse({ access_token: 'gho_test' }),
    () => callback(validRequest()),
  );
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.ok(body.includes('authorization:github:success'));
  assert.ok(body.includes('gho_test'));
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
});

test('callback rejects a request whose state does not match', async () => {
  const res = await callback(
    new Request(`${CALLBACK_URL}?code=abc&state=nope`, {
      headers: { cookie: 'osv_oauth_state=x.y' },
    }),
  );
  assert.equal(res.status, 400);
  assert.ok(isErrorPage(await res.text()));
});

test('callback reports a GitHub-side error through postMessage', async () => {
  const res = await withFetch(
    () => jsonResponse({ error: 'bad_verification_code' }),
    () => callback(validRequest()),
  );
  assert.equal(res.status, 400);
  assert.ok(isErrorPage(await res.text()));
});

// These two are the regression guard: before the try/catch, an unexpected
// failure escaped as a rejection, the platform returned its own 500, and the
// popup hung with nothing posted back to its opener.

test('callback reports a transport failure instead of throwing', async () => {
  const res = await withFetch(
    () => Promise.reject(new Error('ECONNRESET')),
    () => callback(validRequest()),
  );
  assert.equal(res.status, 400);
  assert.ok(isErrorPage(await res.text()));
});

test('callback reports a non-JSON response instead of throwing', async () => {
  const res = await withFetch(
    () => Promise.resolve(new Response('<html>502 from a proxy</html>')),
    () => callback(validRequest()),
  );
  assert.equal(res.status, 400);
  assert.ok(isErrorPage(await res.text()));
});

test('callback bounds the token exchange with an abort signal', async () => {
  let seen;
  await withFetch(
    (_url, options) => {
      seen = options;
      return jsonResponse({ access_token: 'gho_test' });
    },
    () => callback(validRequest()),
  );
  assert.ok(seen.signal, 'token exchange has no AbortSignal');
});

test('a timeout surfaces as an error page, not a hang', async () => {
  const res = await withFetch(
    () =>
      Promise.reject(
        Object.assign(new Error('timed out'), { name: 'TimeoutError' }),
      ),
    () => callback(validRequest()),
  );
  assert.equal(res.status, 400);
  assert.match(await res.text(), /did not respond in time/);
});

test('internal error text never reaches the rendered page', async () => {
  const res = await withFetch(
    () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.1:443')),
    () => callback(validRequest()),
  );
  assert.ok(!(await res.text()).includes('10.0.0.1'));
});

// --------------------------------------------------------------- escaping

test('an injected </script> cannot break out of the handshake page', async () => {
  const res = await withFetch(
    () => jsonResponse({ error: '</script><img src=x onerror=alert(1)>' }),
    () => callback(validRequest()),
  );
  const body = await res.text();
  assert.ok(!body.includes('</script><img'), 'script element was terminated');
  assert.ok(body.includes('\\u003c/script'));
});
