import { normalizeStandardOptions } from '@/game/standard/options';
import { initialState, recordAdvancedAccess } from './runner';
const state = () => structuredClone(initialState(2, 'gate-observation', undefined, normalizeStandardOptions({ treeRules: 'v2-collab' })));


test('gate observation records the drop in play, uses a strict boundary and excludes final scoring', () => {
  const s = state();
  const first: Record<string, number> = {};
  s.G.table.scoreBoard = { '0': 11, '1': 10 };
  recordAdvancedAccess(s, 2, first);
  expect(first).toEqual({});
  s.G.standard!.grown = ['government-1'];
  recordAdvancedAccess(s, 3, first);
  expect(first).toEqual({ '0': 3 });
  recordAdvancedAccess(s, 4, first);
  expect(first).toEqual({ '0': 3 });
  s.ctx.gameover = { winners: ['1'] };
  s.G.table.scoreBoard['1'] = 30;
  recordAdvancedAccess(s, 7, first);
  expect(first).toEqual({ '0': 3 });
});
