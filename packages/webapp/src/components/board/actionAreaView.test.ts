import { getActionAreaView } from './actionAreaView';

describe('getActionAreaView', () => {
  it('gives the current player the contextual action bar', () => {
    expect(getActionAreaView('2', '2', false)).toBe('context');
  });

  it('gives the current player the discard panel while 四大自由 is pending', () => {
    expect(getActionAreaView('2', '2', true)).toBe('discard');
  });

  it.each([
    ['another player', '0'],
    ['an observer', null],
  ])('shows %s the waiting note, including the pending discard', (_who, playerID) => {
    expect(getActionAreaView(playerID, '2', false)).toBe('waiting');
    expect(getActionAreaView(playerID, '2', true)).toBe('waiting');
  });
});
