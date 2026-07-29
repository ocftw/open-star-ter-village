import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const STATE_COOKIE = 'osv_oauth_state';
const MAX_AGE_SECONDS = 600;

/**
 * GitHub requires an identical `redirect_uri` on both the authorize request and
 * the token exchange, so both functions derive it from this single constant.
 * Must match the callback URL registered on the OAuth App.
 */
export const CALLBACK_PATH = '/.netlify/functions/callback';

const stateSecret = () => {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET is not configured');
  }
  return secret;
};

const sign = (value) =>
  createHmac('sha256', stateSecret()).update(value).digest('hex');

/**
 * Mint a random CSRF state plus the signed cookie that binds it to this browser.
 * The signature stops an attacker who can write cookies from forging a pair that
 * matches a `state` they chose.
 */
export const createState = () => {
  const state = randomBytes(32).toString('hex');
  const cookie = [
    `${STATE_COOKIE}=${state}.${sign(state)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_SECONDS}`,
  ].join('; ');

  return { state, cookie };
};

/** Expired cookie, sent on every callback response so state is single-use. */
export const clearStateCookie = () =>
  `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

const readCookie = (header, name) =>
  header
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === name)?.[1];

/**
 * Constant-time comparison of the returned `state` against the signed cookie.
 * Compares HMACs rather than raw values so both buffers are always equal length.
 */
export const verifyState = (cookieHeader, returnedState) => {
  const cookie = readCookie(cookieHeader, STATE_COOKIE);
  if (!cookie || !returnedState) return false;

  const [cookieState, cookieSignature] = cookie.split('.');
  if (!cookieState || !cookieSignature) return false;
  if (cookieState !== returnedState) return false;

  const expected = Buffer.from(sign(cookieState), 'hex');
  const actual = Buffer.from(cookieSignature, 'hex');
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
};
