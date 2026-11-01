import { getActionAreaView } from './actionAreaView';

const during = (discardPending: boolean) => ({ discardPending, gameOver: false });
const after = (discardPending: boolean) => ({ discardPending, gameOver: true });

describe('getActionAreaView', () => {
  it('gives the current player the contextual action bar', () => {
    expect(getActionAreaView('2', '2', during(false))).toBe('context');
  });

  it('gives the current player the discard panel while 四大自由 is pending', () => {
    expect(getActionAreaView('2', '2', during(true))).toBe('discard');
  });

  it.each([
    ['another player', '0'],
    ['an observer', null],
  ])('shows %s the waiting note, including the pending discard', (_who, playerID) => {
    expect(getActionAreaView(playerID, '2', during(false))).toBe('waiting');
    expect(getActionAreaView(playerID, '2', during(true))).toBe('waiting');
  });

  it.each([
    ['the current player', '2'],
    ['another player', '0'],
    ['an observer', null],
  ])('shows %s the game-over note once the game has ended', (_who, playerID) => {
    expect(getActionAreaView(playerID, '2', after(false))).toBe('gameover');
    expect(getActionAreaView(playerID, '2', after(true))).toBe('gameover');
  });
});
