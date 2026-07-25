import { CALLBACK_PATH, createState } from './_oauth-state.mjs';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';

/**
 * Step 1 of the Decap CMS GitHub OAuth handshake.
 *
 * Decap opens this in a popup (`base_url` + `auth_endpoint`). We mint a CSRF
 * state, bind it to the browser via a signed HttpOnly cookie, and hand off to
 * GitHub. `public_repo` is deliberate: the content repo is public, so the
 * broader `repo` scope would grant this app access to every repository the
 * contributor owns.
 */
export default async (request) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const missing = ['GITHUB_CLIENT_ID', 'OAUTH_STATE_SECRET'].filter(
    (name) => !process.env[name],
  );
  if (missing.length) {
    return new Response(`Not configured: ${missing.join(', ')}`, {
      status: 500,
    });
  }

  const { state, cookie } = createState();
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}${CALLBACK_PATH}`,
    scope: 'public_repo',
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${AUTHORIZE_URL}?${params}`,
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
};
