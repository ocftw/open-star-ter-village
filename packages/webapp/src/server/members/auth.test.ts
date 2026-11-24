import { cookies } from 'next/headers';
import type { Session } from 'next-auth';
import { auth, currentMember } from './auth';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next-auth', () => ({ __esModule: true, default: () => ({ auth: jest.fn() }) }));
jest.mock('@auth/pg-adapter', () => ({ __esModule: true, default: jest.fn() }), { virtual: true });
jest.mock('./providers', () => ({ memberProviders: jest.fn() }));

const readSession = jest.mocked(auth as () => Promise<Session | null>);

beforeEach(() => {
  jest.replaceProperty(process, 'env', { NODE_ENV: 'test', DATABASE_URL: 'configured', AUTH_SECRET: 'configured' });
  readSession.mockReset();
});

afterEach(() => jest.restoreAllMocks());

function requestWithCookie(name?: string) {
  jest.mocked(cookies).mockReturnValue({
    get: (key: string) => key === name ? { name: key, value: 'opaque-session' } : undefined,
  } as ReturnType<typeof cookies>);
}

test('resolves a guest without initializing Auth.js when no session cookie is present', async () => {
  requestWithCookie();
  readSession.mockRejectedValue(new Error('Member database is unavailable'));

  await expect(currentMember()).resolves.toBeUndefined();
  expect(readSession).not.toHaveBeenCalled();
});

test.each(['authjs.session-token', '__Secure-authjs.session-token'])(
  'looks up an Auth.js database session from the %s cookie',
  async (name) => {
    requestWithCookie(name);
    const user = { id: 'member', nickname: 'Host' };
    readSession.mockResolvedValue({ user, expires: '2099-01-01T00:00:00Z' });

    await expect(currentMember()).resolves.toEqual(user);
  },
);
