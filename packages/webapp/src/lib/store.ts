import { configureStore } from '@reduxjs/toolkit'
import { wizardReducer }from './reducers/wizard'
import projectSlotSlice from './reducers/projectSlotSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      wizard: wizardReducer,
      projectSlot: projectSlotSlice,
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
