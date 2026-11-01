import { ClientGameState } from '@/game';
import { isFourFreedomsDiscardPending } from './fourFreedomsDiscard';

const makeG = ({
  pending = ['job-a', 'job-b'],
  actions = 0,
  actionPhaseDone = false,
}: { pending?: string[]; actions?: number; actionPhaseDone?: boolean } = {}) =>
  ({
    table: { fourFreedomsPendingDiscards: pending, actionPhaseDone },
    players: {
      '0': { token: { actions: 3 } },
      '1': { token: { actions: 3 } },
      '2': { token: { actions } },
    },
  }) as unknown as ClientGameState;

// Player '2' is last in a 3-player round.
const lastPlayerCtx = { currentPlayer: '2', playOrderPos: 2, numPlayers: 3 };

describe('isFourFreedomsDiscardPending', () => {
  it('is true once the last player has no action points left', () => {
    expect(isFourFreedomsDiscardPending(makeG(), lastPlayerCtx)).toBe(true);
  });

  it('is true when the last player ended their action phase with AP left', () => {
    expect(isFourFreedomsDiscardPending(makeG({ actions: 2, actionPhaseDone: true }), lastPlayerCtx)).toBe(true);
  });

  it('is false while the last player still has AP and is acting', () => {
    expect(isFourFreedomsDiscardPending(makeG({ actions: 1 }), lastPlayerCtx)).toBe(false);
  });

  it('is false when no 四大自由 cards are pending', () => {
    expect(isFourFreedomsDiscardPending(makeG({ pending: [] }), lastPlayerCtx)).toBe(false);
  });

  it('is false for players who are not last in the round', () => {
    const G = makeG();
    (G.players['0'] as { token: { actions: number } }).token.actions = 0;
    expect(isFourFreedomsDiscardPending(G, { currentPlayer: '0', playOrderPos: 0, numPlayers: 3 })).toBe(false);
  });
});
