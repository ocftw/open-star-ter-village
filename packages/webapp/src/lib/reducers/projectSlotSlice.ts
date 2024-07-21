import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProjectSlotState {
  selectedSlots: { [key: string]: boolean };
}

const initialState: ProjectSlotState = {
  selectedSlots: {},
};

const projectSlotSlice = createSlice({
  name: 'projectSlots',
  initialState,
  reducers: {
    toggleProjectSlotSelection: (state, action: PayloadAction<string>) => {
      if (state.selectedSlots[action.payload]) {
        delete state.selectedSlots[action.payload];
      } else {
        state.selectedSlots[action.payload] = true;
      }
    },
    resetProjectSlotSelection: (state) => {
      state.selectedSlots = {};
    },
  },
  selectors: {
    getSelectedProjectSlots: (state: ProjectSlotState) => state.selectedSlots,
  }
});

export const { toggleProjectSlotSelection, resetProjectSlotSelection } = projectSlotSlice.actions;
export const { getSelectedProjectSlots } = projectSlotSlice.selectors;
export default projectSlotSlice.reducer;
