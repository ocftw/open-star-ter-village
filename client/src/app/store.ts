import { configureStore } from '@reduxjs/toolkit'
import actionBoardReducer from '../features/ActionBoard/actionBoardSlice';

export const store = configureStore({
  reducer: {
    actionBoard: actionBoardReducer
  },
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
