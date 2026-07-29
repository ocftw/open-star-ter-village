import {
  CALLBACK_PATH,
  clearStateCookie,
  verifyState,
} from './_oauth-state.mjs';

const TOKEN_URL = 'https://github.com/login/oauth/access_token';

// Netlify's function timeout is 10s; stay inside it so a slow GitHub still
// leaves room to render the error page rather than dying as a platform 500.
const EXCHANGE_TIMEOUT_MS = 8000;

/** Inline JSON into a <script> without letting it terminate the element. */
const embed = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Decap listens for a `postMessage` from this popup. The handshake is:
 * popup announces `authorizing:github` -> opener replies -> popup learns the
 * opener's origin and posts the result back to exactly that origin.
 *
 * We additionally refuse to post to any origin other than our own, so a page
 * that manages to open this popup cannot harvest the token.
 */
const handshakePage = (message, allowedOrigin) => `<!doctype html>
<html><body><script>
(function () {
  var message = ${embed(message)};
  var allowedOrigin = ${embed(allowedOrigin)};
  function receive(event) {
    if (event.origin !== allowedOrigin) return;
    window.removeEventListener('message', receive, false);
    window.opener.postMessage(message, event.origin);
  }
  if (!window.opener) {
    document.body.textContent = 'This page must be opened from the CMS.';
    return;
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', allowedOrigin);
})();
</script></body></html>`;

const respond = (message, origin, status = 200) =>
  new Response(handshakePage(message, origin), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearStateCookie(),
      'Cache-Control': 'no-store',
    },
  });

/**
 * Step 2 of the handshake: validate CSRF state, then trade the code for a token.
 */
export default async (request) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  const fail = (reason) =>
    respond(
      `authorization:github:error:${JSON.stringify({ message: reason })}`,
      origin,
      400,
    );

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.OAUTH_STATE_SECRET) {
    return fail('OAuth app is not configured on the server.');
  }

  // CSRF: reject before spending the code on anything.
  if (!verifyState(request.headers.get('cookie'), returnedState)) {
    return fail(
      'Invalid or expired authorization state. Please try signing in again.',
    );
  }

  if (!code) {
    return fail('GitHub did not return an authorization code.');
  }

  // Everything past here must still resolve to the postMessage handshake page.
  // An escaping rejection becomes a platform 500, which leaves the popup blank
  // and hanging with no way to report the failure to its opener.
  try {
    const exchange = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}${CALLBACK_PATH}`,
      }),
      signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    });

    if (!exchange.ok) {
      return fail(
        `GitHub rejected the token exchange (HTTP ${exchange.status}).`,
      );
    }

    const payload = await exchange.json();
    if (payload.error || !payload.access_token) {
      return fail(
        payload.error_description ||
          payload.error ||
          'No access token returned.',
      );
    }

    return respond(
      `authorization:github:success:${JSON.stringify({
        token: payload.access_token,
        provider: 'github',
      })}`,
      origin,
    );
  } catch (error) {
    // Deliberately generic: the reason is rendered into a page, so internal
    // error text stays out of it.
    return fail(
      error?.name === 'TimeoutError'
        ? 'GitHub did not respond in time. Please try signing in again.'
        : 'Could not reach GitHub to complete sign-in. Please try again.',
    );
  }
};
