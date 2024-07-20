import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HandProjectCardState {
  selectedCards: Record<string, boolean>;
}

const initialState: HandProjectCardState = {
  selectedCards: {},
};

const handProjectCardSlice = createSlice({
  name: 'handProjectCards',
  initialState,
  reducers: {
    toggleHandProjectCardSelection: (state, action: PayloadAction<string>) => {
      if (state.selectedCards[action.payload]) {
        delete state.selectedCards[action.payload];
      } else {
        state.selectedCards[action.payload] = true;
      }
    },
  },
  selectors: {
    getSelectedHandProjectCards: (state: HandProjectCardState) => state.selectedCards,
  },
});

export const { toggleHandProjectCardSelection } = handProjectCardSlice.actions;
export const { getSelectedHandProjectCards } = handProjectCardSlice.selectors;
export default handProjectCardSlice.reducer;
