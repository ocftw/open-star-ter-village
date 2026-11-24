import GameStore from '@/game/store/store';
import { SLASH_WILD_JOB_NAME } from '@/game/core/slashWildJob';
import { PlayersMutator } from '@/game/store/slice/players';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { RuleMutator } from '@/game/store/slice/rule';
import { RefillPending, buildRefillView, isRefillAccepted, splitAccepted } from './refillFlowModel';

const tiles = ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, name: id }));
const pending: RefillPending = { removedIds: ['B', 'C'], tiles, apBefore: 4, playerID: '0', currentPlayer: '0', turn: 1 };
const wild = { id: 'slash-0-1', name: SLASH_WILD_JOB_NAME };
const wildPending = { ...pending, tiles: [wild, ...tiles] };

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
    const G = gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true);
    const sequence = { survivors: tiles.filter((t) => !['B', 'C'].includes(t.id)), incoming: [{ id: 'n1', name: 'n1' }, { id: 'n2', name: 'n2' }], dealt: 0 };
    const keys = (phase: Parameters<typeof buildRefillView>[0], s: typeof sequence | null = sequence) =>
      buildRefillView(phase, pending, s, G, '0').tiles.map((t) => (t.kind === 'card' ? t.id : 'EMPTY'));
    expect(keys('awaiting', null)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(keys('emptying')).toEqual(['A', 'EMPTY', 'EMPTY', 'D', 'E']);
    expect(keys('shifting')).toEqual(['A', 'D', 'E', 'EMPTY', 'EMPTY']);
    expect(keys('dealing')).toEqual(['A', 'D', 'E', 'n1', 'EMPTY']);
    expect(keys('dealing', { ...sequence, dealt: 1 })).toEqual(['A', 'D', 'E', 'n1', 'n2']);
  });

  it('keeps the wild card first and static while real cards empty, shift and deal', () => {
    const G = gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true);
    G.table.jobSlots.unshift(wild);
    RuleMutator.enableSlashWildJobCard(G.rules);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    expect(isRefillAccepted(wildPending, G, '0')).toBe(true);
    const sequence = { ...splitAccepted(wildPending, G), dealt: 0 };
    expect(sequence.survivors.map(({ id }) => id)).toEqual(['A', 'D', 'E']);

    const expectRow = (phase: Parameters<typeof buildRefillView>[0], expected: string[], dealt = 0) => {
      const view = buildRefillView(phase, wildPending, phase === 'awaiting' ? null : { ...sequence, dealt }, G, '0');
      expect(view.count).toBe(5);
      expect(view.tiles[0]).toEqual({ kind: 'card', ...wild });
      expect(view.tiles.slice(1).map((tile) => (tile.kind === 'empty' ? 'EMPTY' : tile.id))).toEqual(expected);
      return view.tiles;
    };
    expect(expectRow('awaiting', ['A', 'B', 'C', 'D', 'E'])[2]).toMatchObject({ id: 'B', ghost: true });
    expectRow('emptying', ['A', 'EMPTY', 'EMPTY', 'D', 'E']);
    expectRow('shifting', ['A', 'D', 'E', 'EMPTY', 'EMPTY']);
    expect(expectRow('dealing', ['A', 'D', 'E', 'n1', 'EMPTY'])[4]).toMatchObject({ id: 'n1', motion: 'deal' });
    expect(expectRow('dealing', ['A', 'D', 'E', 'n1', 'n2'], 1)[5]).toMatchObject({ id: 'n2', motion: 'deal' });
  });

  it('hides the expired wild card when an accepted refill ends the turn', () => {
    const lastAction = { ...wildPending, apBefore: 1 };
    const G = gameWith(['A', 'D', 'E', 'n1', 'n2'], 0, true);
    RuleMutator.enableSlashWildJobCard(G.rules);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0', '1'], true);
    expect(isRefillAccepted(lastAction, G, '0')).toBe(true);

    const sequence = { ...splitAccepted(lastAction, G), dealt: 0 };
    const view = buildRefillView('emptying', lastAction, sequence, G, '0');
    expect(view.count).toBe(5);
    expect(view.tiles.map((tile) => (tile.kind === 'empty' ? 'EMPTY' : tile.id))).toEqual(['A', 'EMPTY', 'EMPTY', 'D', 'E']);
  });

  it('excludes synthetic arrivals and rejects strip-only changes as refill acceptance', () => {
    const nextTurn = gameWith(['slash-1-1', 'A', 'D', 'E', 'n1', 'n2'], 3, true);
    expect(splitAccepted(wildPending, nextTurn).incoming.map(({ id }) => id)).toEqual(['n1', 'n2']);

    const stripped = gameWith(['A', 'B', 'C', 'D', 'E'], 3, true);
    expect(isRefillAccepted(wildPending, stripped, '0')).toBe(false);
    expect(isRefillAccepted({ ...wildPending, removedIds: [wild.id] }, stripped, '0')).toBe(false);
  });
});
