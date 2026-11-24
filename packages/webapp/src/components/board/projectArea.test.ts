import { ProjectSlotState } from '@/game';
import { capacityHint, splitProjectSlots } from './projectArea';

const slot = (id: string, owner: string, occupied = true) =>
  ({ id, owner, card: occupied ? { name: id } : undefined }) as unknown as ProjectSlotState;
const board = [slot('a', '1'), slot('b', '0'), slot('c', '0', false), slot('d', '1'), slot('e', '2')];

describe('splitProjectSlots', () => {
  it('splits by owner in board order and ignores empty slots', () => {
    const { yours, others } = splitProjectSlots(board, '0');
    expect(yours.map((s) => s.id)).toEqual(['b']);
    expect(others.map((s) => s.id)).toEqual(['a', 'd', 'e']);
  });
  it('gives observers everything under others', () => {
    const { yours, others } = splitProjectSlots(board, null);
    expect(yours).toEqual([]);
    expect(others.map((s) => s.id)).toEqual(['a', 'b', 'd', 'e']);
  });
});

describe('capacityHint', () => {
  it('uses 八 for 8 and digits otherwise', () => {
    expect(capacityHint(8)).toBe('場上最多八張專案卡');
    expect(capacityHint(6)).toBe('場上最多 6 張專案卡');
  });
});
