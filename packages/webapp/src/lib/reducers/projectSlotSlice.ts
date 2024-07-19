import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProjectSlotState {
  selectedSlots: { [key: string]: boolean };
}

const initialState: ProjectSlotState = {
  selectedSlots: {},
};

const projectSlotSlice = createSlice({
  name: 'projectSlot',
  initialState,
  reducers: {
    toggleProjectSlotSelection: (state, action: PayloadAction<string>) => {
      if (state.selectedSlots[action.payload]) {
        delete state.selectedSlots[action.payload];
      } else {
        state.selectedSlots[action.payload] = true;
      }
    },
  },
  selectors: {
    getSelectedSlots: (state: ProjectSlotState) => state.selectedSlots,
  }
});

export const { toggleProjectSlotSelection } = projectSlotSlice.actions;
export const { getSelectedSlots } = projectSlotSlice.selectors;
export default projectSlotSlice.reducer;
