import { GameState } from '@/game';
import { passStartPlayerToken } from './passStartPlayerToken';

const pass = (G: Pick<GameState, 'playOrder'>) =>
  passStartPlayerToken({ G } as unknown as Parameters<typeof passStartPlayerToken>[0]);

describe('passStartPlayerToken', () => {
  it('hands the start player token to the next player in order', () => {
    const G = { playOrder: ['0', '1', '2'] };
    pass(G);
    expect(G.playOrder).toEqual(['1', '2', '0']);
  });

  it('wraps around to the original start player after a full cycle', () => {
    const G = { playOrder: ['0', '1', '2'] };
    const starters: string[] = [];
    for (let i = 0; i < 4; i++) {
      pass(G);
      starters.push(G.playOrder[0]);
    }
    expect(starters).toEqual(['1', '2', '0', '1']);
  });

  it('rotates a reduced play order (e.g. after a player leaves) without gaps', () => {
    // Seat '1' left mid-game: only the remaining seats rotate.
    const G = { playOrder: ['0', '2', '3'] };
    pass(G);
    expect(G.playOrder).toEqual(['2', '3', '0']);
    pass(G);
    expect(G.playOrder).toEqual(['3', '0', '2']);
    pass(G);
    expect(G.playOrder).toEqual(['0', '2', '3']);
  });
});
