import { getPlayerID, parseDevConfig } from './devConfig';

describe('parseDevConfig', () => {
  it('defaults to player 1 in offline mode', () => {
    expect(parseDevConfig({})).toEqual({
      ok: true,
      config: {
        perspective: 'player1',
        transport: 'offline',
      },
    });
  });

  it.each([
    ['player1', '0'],
    ['player2', '1'],
    ['player3', '2'],
    ['observer', undefined],
  ] as const)('maps %s to boardgame.io player ID %s', (perspective, playerID) => {
    const result = parseDevConfig({ user: perspective, mode: 'online' });

    expect(result).toEqual({
      ok: true,
      config: {
        perspective,
        transport: 'online',
      },
    });
    expect(getPlayerID(perspective)).toBe(playerID);
  });

  it('uses the first value for repeated query parameters', () => {
    expect(parseDevConfig({
      user: ['player2', 'observer'],
      mode: ['online', 'offline'],
    })).toEqual({
      ok: true,
      config: {
        perspective: 'player2',
        transport: 'online',
      },
    });
  });

  it('reports unsupported users and transports', () => {
    expect(parseDevConfig({ user: 'alice', mode: 'remote' })).toEqual({
      ok: false,
      error:
        'Invalid user "alice". Expected player1, player2, player3, observer. '
        + 'Invalid mode "remote". Expected offline or online.',
    });
  });
});
