import { isTestLoginEnabled, memberProviders } from './providers';

jest.mock('next-auth/providers/google', () => ({ __esModule: true, default: (options: object) => ({ id: 'google', ...options }) }));
jest.mock('next-auth/providers/github', () => ({ __esModule: true, default: (options: object) => ({ id: 'github', ...options }) }));

const realProviders: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  AUTH_GOOGLE_ID: 'configured',
  AUTH_GOOGLE_SECRET: 'configured',
  AUTH_GITHUB_ID: 'configured',
  AUTH_GITHUB_SECRET: 'configured',
};

afterEach(() => jest.restoreAllMocks());

test('a production runtime never registers test login, even with the flag set', () => {
  jest.replaceProperty(process, 'env', { ...realProviders, AUTH_TEST_LOGIN: '1' });
  expect(isTestLoginEnabled()).toBe(false);
  expect(memberProviders().map((provider) => (typeof provider === 'function' ? provider() : provider).id))
    .toEqual(['google', 'github']);
});

test('development test login requires an explicit flag and has no Auth.js provider', () => {
  jest.replaceProperty(process, 'env', { NODE_ENV: 'development' });
  expect(isTestLoginEnabled()).toBe(false);
  process.env.AUTH_TEST_LOGIN = '1';
  expect(isTestLoginEnabled()).toBe(true);
  expect(memberProviders()).toEqual([]);
});

test('OAuth providers need both credentials and preserve only their account ID and contact email', () => {
  expect(memberProviders({ NODE_ENV: 'test', AUTH_GOOGLE_ID: 'configured', AUTH_GITHUB_SECRET: 'configured' })).toEqual([]);
  const [google, github] = memberProviders(realProviders) as unknown as [
    { profile: (profile: object) => unknown }, { profile: (profile: object) => unknown },
  ];
  const email = 'member@example.org';
  const googleProfile = { sub: 'google-id', email, email_verified: true, name: 'private name', picture: 'private image' };
  const githubProfile = { id: 42, email, name: 'private name', avatar_url: 'private image' };
  expect(google.profile(googleProfile)).toEqual({ id: 'google-id', contactEmail: email, email: null, name: null, image: null });
  expect(github.profile(githubProfile)).toEqual({ id: '42', contactEmail: email, email: null, name: null, image: null });
  expect(google.profile({ ...googleProfile, email_verified: false })).toMatchObject({ contactEmail: null });
});
