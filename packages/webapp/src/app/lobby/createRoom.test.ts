import { createRoom } from './actions';
import { GAME_NAME, lobbyClient } from '@/lib/lobbyClient';
import { getHostToken } from '@/lib/getHostToken';

jest.mock('@/lib/getHostToken', () => ({ getHostToken: jest.fn() }));

beforeEach(() => {
  jest.mocked(getHostToken).mockResolvedValue(undefined);
  jest.spyOn(lobbyClient, 'createMatch').mockResolvedValue({ matchID: 'created-match' });
  jest.spyOn(lobbyClient, 'joinMatch').mockResolvedValue({ playerID: '0', playerCredentials: 'seat-secret' });
});
afterEach(() => { jest.restoreAllMocks(); });

it('preserves the guest create/join calls and credentials', async () => {
  expect(await createRoom('Guest', 3)).toEqual({
    matchID: 'created-match', playerID: '0', credential: 'seat-secret', playerName: 'Guest',
  });
  expect(lobbyClient.createMatch).toHaveBeenCalledWith(GAME_NAME, { numPlayers: 3 });
  expect(lobbyClient.joinMatch).toHaveBeenCalledWith(GAME_NAME, 'created-match', {
    playerID: '0', playerName: 'Guest',
  });
});

it('passes a member token only in the third argument Authorization header', async () => {
  jest.mocked(getHostToken).mockResolvedValue('test-host-token');
  await createRoom('Member', 4);
  expect(lobbyClient.createMatch).toHaveBeenCalledWith(GAME_NAME, { numPlayers: 4 }, {
    headers: { Authorization: 'Bearer test-host-token' },
  });
  expect(lobbyClient.joinMatch).toHaveBeenCalledWith(GAME_NAME, 'created-match', {
    playerID: '0', playerName: 'Member',
  });
});
