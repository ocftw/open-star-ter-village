import GameStore from '@/game/store/store';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { remainingActionUses } from './actionPanel';

describe('remainingActionUses', () => {
  it('is 1 for a free slot', () => {
    const G = GameStore.initialState();
    expect(remainingActionUses(G, 'removeAndRefillJobs')).toBe(1);
  });
  it('is 0 once the slot is occupied', () => {
    const G = GameStore.initialState();
    ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);
    expect(remainingActionUses(G, 'removeAndRefillJobs')).toBe(0);
    expect(remainingActionUses(G, 'recruit')).toBe(1);
  });
});
