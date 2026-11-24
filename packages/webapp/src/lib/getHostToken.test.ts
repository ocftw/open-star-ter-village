import { getHostToken, hostTokenInit } from './getHostToken';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

test('guests never call /api/game-token', async () => {
  await expect(getHostToken(false)).resolves.toBeUndefined();
  await expect(hostTokenInit(false)).resolves.toBeUndefined();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('a signed-in member sends the issued token as a bearer header', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 'tok', expiresAt: 1 }) });
  await expect(hostTokenInit(true)).resolves.toEqual({ headers: { Authorization: 'Bearer tok' } });
  expect(fetchMock).toHaveBeenCalledWith('/api/game-token', expect.objectContaining({ cache: 'no-store' }));
});

test('a signed-in member falls back to guest hosting when the token call fails', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503 });
  await expect(getHostToken(true)).resolves.toBeUndefined();
});
