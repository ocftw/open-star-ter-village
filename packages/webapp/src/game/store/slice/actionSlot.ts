export interface ActionSlot {
  isActive: boolean;
  isOccupied: boolean;
}
export const initialState = (): ActionSlot => ({
  isActive: true,
  isOccupied: false,
});

const reset = (state: ActionSlot) => {
  state.isActive = true;
  state.isOccupied = false;
};

const occupy = (state: ActionSlot) => {
  state.isOccupied = true;
}

const isAvailable = (state: ActionSlot) => {
  return state.isActive && !state.isOccupied;
};

const ActionSlotSlice = {
  initialState,
  mutators: {
    occupy,
    reset,
  },
  selectors: {
    isAvailable,
  },
};

export const ActionSlotMutator = ActionSlotSlice.mutators;
export const ActionSlotSelector = ActionSlotSlice.selectors;
export default ActionSlotSlice;
