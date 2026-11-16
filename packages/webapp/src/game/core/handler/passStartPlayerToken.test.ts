import { GameState } from '@/game';
import { passStartPlayerToken } from './passStartPlayerToken';

type Rotation = GameState['starterRotation'];
type TestG = Pick<GameState, 'playOrder'> & { starterRotation?: Rotation };

const pass = (G: TestG) =>
  passStartPlayerToken({ G } as unknown as Parameters<typeof passStartPlayerToken>[0]);

describe('passStartPlayerToken', () => {
  it('hands the start player token to the next player in order', () => {
    const G: TestG = { playOrder: ['0', '1', '2'], starterRotation: 'clockwise' };
    pass(G);
    expect(G.playOrder).toEqual(['1', '2', '0']);
  });

  it('wraps around to the original start player after a full cycle', () => {
    const G: TestG = { playOrder: ['0', '1', '2'], starterRotation: 'clockwise' };
    const starters: string[] = [];
    for (let i = 0; i < 4; i++) {
      pass(G);
      starters.push(G.playOrder[0]);
    }
    expect(starters).toEqual(['1', '2', '0', '1']);
  });

  it('rotates any play order (non-contiguous seat ids) without gaps', () => {
    // Seat ids need not be contiguous: only the listed seats rotate.
    const G: TestG = { playOrder: ['0', '2', '3'], starterRotation: 'clockwise' };
    pass(G);
    expect(G.playOrder).toEqual(['2', '3', '0']);
    pass(G);
    expect(G.playOrder).toEqual(['3', '0', '2']);
    pass(G);
    expect(G.playOrder).toEqual(['0', '2', '3']);
  });

  it("'none' leaves the play order untouched", () => {
    const G: TestG = { playOrder: ['0', '1', '2'], starterRotation: 'none' };
    pass(G);
    pass(G);
    expect(G.playOrder).toEqual(['0', '1', '2']);
  });

  it('treats a missing or unrecognized starterRotation as none', () => {
    const missing: TestG = { playOrder: ['0', '1', '2'] };
    pass(missing);
    expect(missing.playOrder).toEqual(['0', '1', '2']);
    const bogus: TestG = { playOrder: ['0', '1', '2'], starterRotation: 'sideways' as Rotation };
    pass(bogus);
    expect(bogus.playOrder).toEqual(['0', '1', '2']);
  });

  it("'counterclockwise' moves the last seat to the front", () => {
    const G: TestG = { playOrder: ['0', '1', '2'], starterRotation: 'counterclockwise' };
    pass(G);
    expect(G.playOrder).toEqual(['2', '0', '1']);
    pass(G);
    expect(G.playOrder).toEqual(['1', '2', '0']);
    pass(G);
    expect(G.playOrder).toEqual(['0', '1', '2']);
  });
});
