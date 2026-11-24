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

const acceptedThisTurn = (snapshot: RefillPending, G: ReturnType<typeof gameWith>, playerID: string) =>
  isRefillAccepted(snapshot, { G, playerID, turn: snapshot.turn, log: [] });

describe('refill flow helpers', () => {
  it('accepts only removal + AP + occupied slot for this player', () => {
    expect(acceptedThisTurn(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true), '0')).toBe(true);
    expect(acceptedThisTurn(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 4, true), '0')).toBe(false);
    expect(acceptedThisTurn(pending, gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, false), '0')).toBe(false);
    expect(acceptedThisTurn(pending, gameWith(['A', 'B', 'D', 'E'], 3, true), '0')).toBe(false);
    expect(acceptedThisTurn(pending, gameWith(['A', 'D', 'E'], 3, true), '1')).toBe(false);
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
      buildRefillView(phase, pending, s, G, '0', '0').tiles.map((t) => (t.kind === 'card' ? t.id : 'EMPTY'));
    expect(keys('awaiting', null)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(keys('emptying')).toEqual(['A', 'EMPTY', 'EMPTY', 'D', 'E']);
    expect(keys('shifting')).toEqual(['A', 'D', 'E', 'EMPTY', 'EMPTY']);
    expect(keys('dealing')).toEqual(['A', 'D', 'E', 'n1', 'EMPTY']);
    expect(keys('dealing', { ...sequence, dealt: 1 })).toEqual(['A', 'D', 'E', 'n1', 'n2']);
  });

  it('keeps the wild card first and static while real cards empty, shift and deal', () => {
    const G = gameWith(['A', 'D', 'E', 'n1', 'n2'], 3, true);
    G.table.round = 1;
    G.table.jobSlots.unshift(wild);
    RuleMutator.enableSlashWildJobCard(G.rules);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    expect(acceptedThisTurn(wildPending, G, '0')).toBe(true);
    const sequence = { ...splitAccepted(wildPending, G), dealt: 0 };
    expect(sequence.survivors.map(({ id }) => id)).toEqual(['A', 'D', 'E']);

    const expectRow = (phase: Parameters<typeof buildRefillView>[0], expected: string[], dealt = 0) => {
      const view = buildRefillView(phase, wildPending, phase === 'awaiting' ? null : { ...sequence, dealt }, G, '0', '0');
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

  it.each([
    ['belongs to another player', 'slash-1-1', '0'],
    ['belongs to another round', 'slash-0-0', '0'],
    ["is present after the viewer's turn", wild.id, '1'],
    ['is live for another player', 'slash-1-1', '1'],
  ])('hides a wild tile that %s', (_, id, currentPlayer) => {
    const G = gameWith(tiles.map((tile) => tile.id), 4, false);
    G.table.round = 1;
    const wildCard = { ...wild, id };
    G.table.jobSlots.unshift(wildCard);
    RuleMutator.enableSlashWildJobCard(G.rules);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0', '1'], true);

    const snapshot = { ...pending, tiles: [wildCard, ...tiles] };
    const view = buildRefillView('awaiting', snapshot, null, G, pending.playerID, currentPlayer);
    expect(view.count).toBe(tiles.length);
    expect(view.tiles.map((tile) => tile.kind === 'card' && tile.id)).toEqual(tiles.map((tile) => tile.id));
  });

  it('excludes synthetic arrivals and rejects strip-only changes as refill acceptance', () => {
    const nextTurn = gameWith(['slash-1-1', 'A', 'D', 'E', 'n1', 'n2'], 3, true);
    expect(splitAccepted(wildPending, nextTurn).incoming.map(({ id }) => id)).toEqual(['n1', 'n2']);

    const stripped = gameWith(['A', 'B', 'C', 'D', 'E'], 3, true);
    expect(acceptedThisTurn(wildPending, stripped, '0')).toBe(false);
    expect(acceptedThisTurn({ ...wildPending, removedIds: [wild.id] }, stripped, '0')).toBe(false);
  });
});
