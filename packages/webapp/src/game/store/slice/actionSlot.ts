export interface ActionSlot {
  isOccupied: boolean;
}
export const initialState = (): ActionSlot => ({
  isOccupied: false,
});

const reset = (state: ActionSlot) => {
  state.isOccupied = false;
};

const occupy = (state: ActionSlot) => {
  state.isOccupied = true;
}

const ActionSlotSlice = {
  initialState,
  mutators: {
    occupy,
    reset,
  },
  selectors: {
    isAvailable: (state: ActionSlot) => !state.isOccupied,
    isOccupied: (state: ActionSlot) => state.isOccupied,
  },
};

export const ActionSlotMutator = ActionSlotSlice.mutators;
export const ActionSlotSelector = ActionSlotSlice.selectors;
export default ActionSlotSlice;
