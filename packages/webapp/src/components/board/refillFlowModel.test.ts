import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { RefillPending, buildRefillView, isRefillAccepted, splitAccepted } from './refillFlowModel';

const tiles = ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, name: id }));
const pending: RefillPending = { removedIds: ['B', 'C'], tiles, apBefore: 4, playerID: '0', currentPlayer: '0', turn: 1 };

function gameWith(ids: string[], ap: number, occupied: boolean) {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1']);
  PlayersMutator.resetActionTokens(G.players, '0', ap);
  JobSlotsMutator.addJobCards(G.table.jobSlots, ids.map((id) => ({ id, name: id })));
  if (occupied) ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);
  return G;
}

describe('refill flow helpers', () => {
  it('accepts only removal + AP + occupied slot for this player', () => {
    expect(isRefillAccepted(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true), '0')).toBe(true);
    expect(isRefillAccepted(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 4, true), '0')).toBe(false);
    expect(isRefillAccepted(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, false), '0')).toBe(false);
    expect(isRefillAccepted(pending, gameWith(['A', 'B', 'D', 'E'], 3, true), '0')).toBe(false);
    expect(isRefillAccepted(pending, gameWith(['A', 'D', 'E'], 3, true), '1')).toBe(false);
  });

  it('keeps survivors in order and finds incoming cards by identity', () => {
    const split = splitAccepted(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true));
    expect(split.survivors.map((c) => c.id)).toEqual(['A', 'D', 'E']);
    expect(split.incoming.map((c) => c.id)).toEqual(['n1', 'n2']);
  });

  it('never contains an incoming face before dealing, and appends at the right end', () => {
    const sequence = { survivors: tiles.filter((t) => !['B', 'C'].includes(t.id)), incoming: [{ id: 'n1', name: 'n1' }, { id: 'n2', name: 'n2' }], dealt: 0 };
    const keys = (phase: Parameters<typeof buildRefillView>[0], s = sequence) =>
      buildRefillView(phase, pending, s).tiles.map((t) => (t.kind === 'card' ? t.id : 'EMPTY'));
    expect(keys('awaiting', null as never)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(keys('emptying')).toEqual(['A', 'EMPTY', 'EMPTY', 'D', 'E']);
    expect(keys('shifting')).toEqual(['A', 'D', 'E', 'EMPTY', 'EMPTY']);
    expect(keys('dealing')).toEqual(['A', 'D', 'E', 'n1', 'EMPTY']);
    expect(keys('dealing', { ...sequence, dealt: 1 })).toEqual(['A', 'D', 'E', 'n1', 'n2']);
  });
});
