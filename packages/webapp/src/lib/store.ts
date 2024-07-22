import { configureStore } from '@reduxjs/toolkit'
import projectSlotSlice from './reducers/projectSlotSlice'
import jobSlotSlice from './reducers/jobSlotSlice'
import handProjectCardSlice from './reducers/handProjectCardSlice'
import actionStepSlice from './reducers/actionStepSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      projectSlots: projectSlotSlice,
      jobSlots: jobSlotSlice,
      handProjectCards: handProjectCardSlice,
      actionSteps: actionStepSlice,
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
