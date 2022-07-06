import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface HeaderState {
  playerId: string | undefined;
}

const initialState: HeaderState = {
  playerId: undefined,
}

export const headerSlice = createSlice({
  name: 'header',
  initialState,
  reducers: {
    setPlayerId: (state, action: PayloadAction<HeaderState['playerId']>) => {
      state.playerId = action.payload;
    },
  },
})

export const { setPlayerId } = headerSlice.actions

export default headerSlice.reducer
