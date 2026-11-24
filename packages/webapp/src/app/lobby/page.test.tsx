import { renderToStaticMarkup } from 'react-dom/server';
import { currentMember } from '@/server/members/auth';
import LobbyPage from './page';

jest.mock('next/navigation', () => ({ useRouter: jest.fn(), redirect: jest.fn() }));
jest.mock('@/server/members/auth', () => ({ currentMember: jest.fn() }));
jest.mock('next-auth/providers/google', () => ({ __esModule: true, default: () => ({ id: 'google' }) }));
jest.mock('next-auth/providers/github', () => ({ __esModule: true, default: () => ({ id: 'github' }) }));

beforeEach(() => {
  jest.replaceProperty(process, 'env', { NODE_ENV: 'test', DATABASE_URL: 'configured' });
  jest.mocked(currentMember).mockReset().mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

test.each([
  { AUTH_TEST_LOGIN: '1' },
  { AUTH_SECRET: 'configured', AUTH_GOOGLE_ID: 'configured' },
  { NODE_ENV: 'production', AUTH_SECRET: 'configured', AUTH_TEST_LOGIN: '1' },
])('hides guest sign-in and persistence prompts without a usable sign-in method (%j)', async (env) => {
  Object.assign(process.env, env);
  const lobby = renderToStaticMarkup(await LobbyPage());

  expect(lobby).toContain('Member features are temporarily unavailable');
  expect(lobby).not.toContain('href="/sign-in"');
  expect(lobby).not.toContain('Sign in to keep this game safe');
});

test('offers guest sign-in with a fully configured OAuth provider', async () => {
  Object.assign(process.env, { AUTH_SECRET: 'configured', AUTH_GOOGLE_ID: 'configured', AUTH_GOOGLE_SECRET: 'configured' });
  const lobby = renderToStaticMarkup(await LobbyPage());

  expect(lobby).toContain('href="/sign-in"');
  expect(lobby).toContain('Sign in to keep this game safe');
});
