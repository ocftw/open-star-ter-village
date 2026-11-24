import { reconcileStartPicks, getStartProjectView, isWildPair, pairTier } from './startProjectOrder';
import type { JobCard, ProjectCard } from '@/game';
import { SLASH_WILD_JOB_NAME } from '@/game/core/slashWildJob';
import type { ValidatableState } from '@/game/core/stage/action/validate';
import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator } from '@/game/store/slice/projectBoard';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { RuleMutator } from '@/game/store/slice/rule';

const project = (id: string, ...jobs: string[]): ProjectCard => ({
  id, name: id, difficulty: 1, type: '開放政府', description: '', requirements: Object.fromEntries(jobs.map((j) => [j, 3])),
});

// P1..P4 hand; J1..J5 market in G order. P2 needs J2/J4's jobs, J4 fits P2/P4, J2 fits P2/P3.
const hand = [project('P1', 'pm'), project('P2', 'dev', 'ux'), project('P3', 'dev'), project('P4', 'ux')];
const market: JobCard[] = [
  { id: 'J1', name: 'qa' }, { id: 'J2', name: 'dev' }, { id: 'J3', name: 'ops' },
  { id: 'J4', name: 'ux' }, { id: 'J5', name: 'doc' },
];
const wild = { id: 'slash-0-1', name: SLASH_WILD_JOB_NAME };

function makeG(over: {
  hand?: ProjectCard[]; market?: JobCard[]; entitled?: boolean; marked?: boolean; ap?: number; full?: boolean; workers?: number;
} = {}): ValidatableState {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1']);
  ProjectBoardMutator.initialize(G.table.projectBoard, 3);
  G.players['0'].token = { actions: over.ap ?? 4, workers: over.workers ?? 4, overtime: 0 };
  G.players['0'].hand.projects = (over.hand ?? hand);
  G.players['1'].hand.projects = [project('OTHER', 'dev')];
  G.table.jobSlots = (over.market ?? market);
  if (over.full) G.table.projectBoard.forEach((slot) => { slot.card = project('X', 'dev'); });
  if (over.marked) RuleMutator.enableSlashWildJobCard(G.rules);
  if (over.entitled) RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
  return G;
}

const ids = (entries: { card: { id: string } }[]) => entries.map((e) => e.card.id);
const enabled = (entries: { card: { id: string }; tier: string }[]) =>
  entries.filter((e) => e.tier !== 'disabled').map((e) => e.card.id);
const none = { projectId: null, jobId: null };


describe('getStartProjectView', () => {
  it('keeps G order when nothing is picked', () => {
    const view = getStartProjectView(makeG(), '0', none);
    expect(ids(view.hand)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(ids(view.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
    expect(view.market.every((e) => e.tier === 'match')).toBe(true);
  });

  it('project first: usable jobs first in G order, the rest disabled', () => {
    const view = getStartProjectView(makeG(), '0', { projectId: 'P2', jobId: null });
    expect(ids(view.market)).toEqual(['J2', 'J4', 'J1', 'J3', 'J5']);
    expect(enabled(view.market)).toEqual(['J2', 'J4']);
    expect(ids(view.hand)).toEqual(['P1', 'P2', 'P3', 'P4']);
  });

  it('job first: reorders only your own hand', () => {
    const view = getStartProjectView(makeG(), '0', { projectId: null, jobId: 'J4' });
    expect(ids(view.hand)).toEqual(['P2', 'P4', 'P1', 'P3']);
    expect(enabled(view.hand)).toEqual(['P2', 'P4']);
    expect(ids(view.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
    expect(ids(view.hand)).not.toContain('OTHER');
  });

  it('both selected: each list follows the counterpart and picks stay enabled', () => {
    const view = getStartProjectView(makeG(), '0', { projectId: 'P2', jobId: 'J4' });
    expect(enabled(view.hand)).toEqual(['P2', 'P4']);
    expect(enabled(view.market)).toEqual(['J2', 'J4']);
  });

  it('unselecting restores the cleared list to current G while the remaining pick keeps its filter', () => {
    const afterProjectCleared = getStartProjectView(makeG(), '0', { projectId: null, jobId: 'J4' });
    expect(ids(afterProjectCleared.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
    expect(ids(afterProjectCleared.hand)).toEqual(['P2', 'P4', 'P1', 'P3']);
    const afterJobCleared = getStartProjectView(makeG(), '0', { projectId: 'P2', jobId: null });
    expect(ids(afterJobCleared.hand)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(ids(afterJobCleared.market)).toEqual(['J2', 'J4', 'J1', 'J3', 'J5']);
    const cleared = getStartProjectView(makeG(), '0', none);
    expect(ids(cleared.hand)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(ids(cleared.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
  });

  it('re-applies when G changes (new market order is partitioned again)', () => {
    const reshuffled = [market[3], market[0], market[1], market[2]];
    const view = getStartProjectView(makeG({ market: reshuffled }), '0', { projectId: 'P2', jobId: null });
    expect(ids(view.market)).toEqual(['J4', 'J2', 'J1', 'J3']);
  });

  it('legacy entitlement sorts usable ordinary mismatches after matches', () => {
    const on = getStartProjectView(makeG({ entitled: true }), '0', { projectId: 'P2', jobId: null });
    expect(ids(on.market)).toEqual(['J2', 'J4', 'J1', 'J3', 'J5']);
    expect(on.market.map((e) => e.tier)).toEqual(['match', 'match', 'wild', 'wild', 'wild']);
    expect(enabled(on.market)).toEqual(ids(on.market));
    const off = getStartProjectView(makeG({ entitled: false }), '0', { projectId: 'P2', jobId: null });
    expect(off.market.map((e) => e.tier)).toEqual(['match', 'match', 'disabled', 'disabled', 'disabled']);
  });

  it('in marked games sorts the wild tile after matches and disables ordinary mismatches', () => {
    const G = makeG({ marked: true, entitled: true, market: [wild, ...market] });
    const view = getStartProjectView(G, '0', { projectId: 'P2', jobId: null });
    expect(ids(view.market)).toEqual(['J2', 'J4', wild.id, 'J1', 'J3', 'J5']);
    expect(view.market.map(({ tier }) => tier)).toEqual(['match', 'match', 'wild', 'disabled', 'disabled', 'disabled']);
    const jobFirst = getStartProjectView(G, '0', { projectId: null, jobId: wild.id });
    expect(ids(jobFirst.hand)).toEqual(hand.map(({ id }) => id));
    expect(jobFirst.hand.map(({ tier }) => tier)).toEqual(hand.map(() => 'wild'));
  });

  it('a spent or foreign wild tile cannot mask ordinary mismatches', () => {
    const foreign = { ...wild, id: 'slash-1-1' };
    const G = makeG({ marked: true, market: [wild, foreign, ...market] });
    const view = getStartProjectView(G, '0', { projectId: 'P2', jobId: null });
    expect(enabled(view.market)).toEqual(['J2', 'J4']);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    expect(pairTier(G, '0', hand[1], foreign)).toBe('disabled');
  });

  it('START is a 2-AP action, so an occupied slot (overtime unavailable) is a no-op', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    G.players['0'].token.overtime = 1;
    const view = getStartProjectView(G, '0', { projectId: 'P2', jobId: null });
    expect(ids(view.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
    expect(view.market.every((e) => e.tier === 'match')).toBe(true);
  });

  it('honors an available overtime START under a 1 AP rule', () => {
    const G = makeG();
    G.rules.action.createProject.actionCost = 1;
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    G.players['0'].token.overtime = 1;
    const view = getStartProjectView(G, '0', { projectId: 'P2', jobId: null });
    expect(ids(view.market)).toEqual(['J2', 'J4', 'J1', 'J3', 'J5']);
    expect(enabled(view.market)).toEqual(['J2', 'J4']);
  });

  it('board full / no AP / no workers: no reorder, nothing disabled', () => {
    for (const over of [{ full: true }, { ap: 0 }, { workers: 0 }]) {
      const view = getStartProjectView(makeG(over), '0', { projectId: 'P2', jobId: null });
      expect(ids(view.market)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
      expect(view.market.every((e) => e.tier === 'match')).toBe(true);
    }
  });

  it('pairTier uses the validator', () => {
    expect(pairTier(makeG(), '0', hand[1], market[1])).toBe('match');
    expect(pairTier(makeG({ entitled: true }), '0', hand[0], market[1])).toBe('wild');
    expect(pairTier(makeG(), '0', hand[0], market[1])).toBe('disabled');
  });
});

describe('reconcileStartPicks', () => {
  const both = { projectId: 'P2', jobId: 'J4' };

  it('drops ids that left G first', () => {
    const r = reconcileStartPicks(makeG({ market: market.filter((j) => j.id !== 'J4') }), '0', both, 'dev', 'project');
    expect(r).toEqual({ picks: { projectId: 'P2', jobId: null }, assignedJobName: null });
    const r2 = reconcileStartPicks(makeG({ hand: hand.filter((p) => p.id !== 'P2') }), '0', both, null, 'job');
    expect(r2.picks).toEqual({ projectId: null, jobId: 'J4' });
  });

  it('keeps a natural match and clears an unnecessary assignedJobName', () => {
    const r = reconcileStartPicks(makeG({ marked: true, entitled: true }), '0', both, 'dev', 'project');
    expect(r).toEqual({ picks: both, assignedJobName: null });
  });

  it('keeps an eligible legacy mismatch while the entitlement is on', () => {
    const mismatch = { projectId: 'P1', jobId: 'J2' };
    expect(reconcileStartPicks(makeG({ entitled: true }), '0', mismatch, null, 'project'))
      .toEqual({ picks: mismatch, assignedJobName: null });
    expect(reconcileStartPicks(makeG({ entitled: true }), '0', mismatch, 'pm', 'project').assignedJobName).toBe('pm');
    expect(reconcileStartPicks(makeG({ entitled: true }), '0', mismatch, 'dev', 'project').assignedJobName).toBeNull();
  });

  it('drops a marked ordinary mismatch even while the player is entitled', () => {
    const G = makeG({ marked: true, entitled: true });
    const pair = { projectId: 'P1', jobId: 'J2' };
    expect(reconcileStartPicks(G, '0', pair, 'pm', 'project'))
      .toEqual({ picks: { projectId: 'P1', jobId: null }, assignedJobName: null });
  });

  it('keeps a wild pair through global blockers and clears its assignment when the tile disappears', () => {
    const pair = { projectId: 'P2', jobId: wild.id };
    for (const blocker of [{ full: true }, { ap: 0 }]) {
      const G = makeG({ ...blocker, marked: true, entitled: true, market: [wild, ...market] });
      expect(reconcileStartPicks(G, '0', pair, 'ux', 'job')).toEqual({ picks: pair, assignedJobName: 'ux' });
      expect(reconcileStartPicks(G, '0', pair, 'pm', 'job')).toEqual({ picks: pair, assignedJobName: null });
    }
    expect(reconcileStartPicks(makeG({ marked: true }), '0', pair, 'ux', 'job'))
      .toEqual({ picks: { projectId: 'P2', jobId: null }, assignedJobName: null });
  });

  it.each([
    ['project', { projectId: 'P1', jobId: null }],
    ['job', { projectId: null, jobId: 'J2' }],
  ] as const)('entitlement lost on a mismatch keeps the earlier pick (%s first)', (first, expected) => {
    const r = reconcileStartPicks(makeG({ entitled: false }), '0', { projectId: 'P1', jobId: 'J2' }, 'pm', first);
    expect(r).toEqual({ picks: expected, assignedJobName: null });
    // the earlier pick drives both lists
    const view = getStartProjectView(makeG({ entitled: false }), '0', r.picks);
    if (first === 'project') expect(enabled(view.market)).toEqual([]);
    else expect(enabled(view.hand)).toEqual(['P2', 'P3']);
  });

  it('board full / no AP keeps both picks', () => {
    expect(reconcileStartPicks(makeG({ full: true }), '0', both, null, 'project').picks).toEqual(both);
    expect(reconcileStartPicks(makeG({ ap: 0 }), '0', both, null, 'project').picks).toEqual(both);
  });
});

describe('isWildPair', () => {
  it('in legacy games needs a mismatch and the entitlement', () => {
    const pair = { projectId: 'P1', jobId: 'J2' };
    expect(isWildPair(makeG({ entitled: true }), '0', pair)).toBe(true);
    expect(isWildPair(makeG({ entitled: false }), '0', pair)).toBe(false);
    expect(isWildPair(makeG({ entitled: true }), '0', { projectId: 'P2', jobId: 'J2' })).toBe(false);
    expect(isWildPair(makeG({ entitled: true }), '0', { projectId: 'P1', jobId: null })).toBe(false);
  });

  it('in marked games requires the player’s own unspent wild tile and a project', () => {
    const G = makeG({ marked: true, entitled: true, market: [wild, ...market] });
    expect(isWildPair(G, '0', { projectId: 'P1', jobId: 'J2' })).toBe(false);
    expect(isWildPair(G, '0', { projectId: null, jobId: wild.id })).toBe(false);
    const pair = { projectId: 'P1', jobId: wild.id };
    expect(isWildPair(G, '0', pair)).toBe(true);
    const spent = makeG({ marked: true, market: [wild, ...market] });
    expect(isWildPair(spent, '0', pair)).toBe(false);
  });
});
