import { GET } from './route';
import { currentMember } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';
import { readHostTokenSecret, verifyHostToken } from '@/server/persistence/hostToken';

jest.mock('@/server/members/auth', () => ({ currentMember: jest.fn() }));
jest.mock('@/server/members/database', () => ({ memberFeaturesEnabled: jest.fn() }));

const secret = 'fixture-shared-key-for-tests-only-32-bytes';

beforeEach(() => {
  jest.replaceProperty(process, 'env', { ...process.env, GAME_SERVER_AUTH_SECRET: secret });
  jest.mocked(memberFeaturesEnabled).mockReturnValue(true);
  jest.mocked(currentMember).mockReset();
});

afterEach(() => jest.restoreAllMocks());

it('rejects unavailable persistence, a missing or short key, and guests', async () => {
  jest.mocked(memberFeaturesEnabled).mockReturnValueOnce(false);
  expect((await GET()).status).toBe(503);
  delete process.env.GAME_SERVER_AUTH_SECRET;
  expect((await GET()).status).toBe(503);
  process.env.GAME_SERVER_AUTH_SECRET = 'short';
  expect((await GET()).status).toBe(503);
  process.env.GAME_SERVER_AUTH_SECRET = secret;
  expect((await GET()).status).toBe(401);
  jest.mocked(currentMember).mockResolvedValueOnce({ id: 'pending', nickname: null });
  expect((await GET()).status).toBe(401);
});

it('issues five-minute tokens accepted by the game server and limits each member', async () => {
  const now = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(now);
  jest.mocked(currentMember).mockResolvedValue({ id: 'host', nickname: 'Host' });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  const { token, expiresAt } = await response.json();
  expect(expiresAt).toBe(Math.floor(now / 1000) + 300);
  expect(await verifyHostToken(token, readHostTokenSecret(secret)!)).toEqual({ userId: 'host' });
  for (let attempt = 1; attempt < 10; attempt++) expect((await GET()).status).toBe(200);
  expect((await GET()).status).toBe(429);
  jest.mocked(currentMember).mockResolvedValueOnce({ id: 'other', nickname: 'Other' });
  expect((await GET()).status).toBe(200);
  jest.mocked(Date.now).mockReturnValue(now + 60_000);
  expect((await GET()).status).toBe(200);
});
