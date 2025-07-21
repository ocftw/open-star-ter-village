import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JobSlotState {
  selectedSlots: { [key: string]: boolean };
}

const initialState: JobSlotState = {
  selectedSlots: {},
};

const jobSlotSlice = createSlice({
  name: 'jobSlots',
  initialState,
  reducers: {
    toggleJobSlotSelection: (state, action: PayloadAction<string>) => {
      if (state.selectedSlots[action.payload]) {
        delete state.selectedSlots[action.payload];
      } else {
        state.selectedSlots[action.payload] = true;
      }
    },
    resetJobSlotSelection: (state) => {
      state.selectedSlots = {};
    },
  },
  selectors: {
    getSelectedJobSlots: (state: JobSlotState) => state.selectedSlots,
  }
});

export const { toggleJobSlotSelection, resetJobSlotSelection } = jobSlotSlice.actions;
export const { getSelectedJobSlots } = jobSlotSlice.selectors;
export default jobSlotSlice.reducer;
