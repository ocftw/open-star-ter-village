import { getLobbyStatus, toVisibleMatch, type LobbyMatch } from './actions';

type LobbyPlayer = LobbyMatch['players'][number];

const makeMatch = (players: Partial<LobbyPlayer>[], extra: Partial<LobbyMatch> = {}): LobbyMatch =>
  ({
    matchID: 'room-1',
    players: players.map((player, id) => ({ id, ...player })),
    ...extra,
  } as LobbyMatch);

const startedHost = { name: 'Alice', data: { started: true } };

describe('getLobbyStatus / toVisibleMatch (#420 abandoned-match lobby filter)', () => {
  it('hides a started match with a vacated seat as Abandoned', () => {
    const match = makeMatch([startedHost, { name: 'Bob' }, {}]);
    expect(getLobbyStatus(match)).toBe('Abandoned');
    expect(toVisibleMatch(match)).toBeNull();
  });

  it('keeps a fully seated started match visible as In Progress', () => {
    const match = makeMatch([startedHost, { name: 'Bob' }, { name: 'Carol' }]);
    expect(getLobbyStatus(match)).toBe('In Progress');
    expect(toVisibleMatch(match)?.status).toBe('In Progress');
  });

  it('keeps a not-yet-started match with open seats visible as Waiting', () => {
    const match = makeMatch([{ name: 'Alice' }, {}, {}]);
    expect(getLobbyStatus(match)).toBe('Waiting');
    expect(toVisibleMatch(match)?.openSeatID).toBe('1');
  });

  it('hides a match every player has left or disconnected from', () => {
    const match = makeMatch([{ name: 'Alice', isConnected: false }, {}, {}]);
    expect(getLobbyStatus(match)).toBe('Abandoned');
    expect(toVisibleMatch(match)).toBeNull();
  });

  it('hides finished matches', () => {
    const match = makeMatch([startedHost, { name: 'Bob' }, { name: 'Carol' }], {
      gameover: { winners: ['0'] },
    });
    expect(getLobbyStatus(match)).toBe('Finished');
    expect(toVisibleMatch(match)).toBeNull();
  });
});
