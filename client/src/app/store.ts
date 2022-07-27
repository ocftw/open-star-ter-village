import { configureStore } from '@reduxjs/toolkit'
import actionBoardSlice from '../features/ActionBoard/actionBoardSlice';

export const store = configureStore({
  reducer: {
    actionBoard: actionBoardSlice.reducer
  },
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
