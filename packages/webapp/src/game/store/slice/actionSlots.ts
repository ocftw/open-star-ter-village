import { ActionMoveName } from "@/game/core/stage/action/move/type";
import ActionSlotSlice, { ActionSlot, ActionSlotMutator } from "./actionSlot";

export type ActionSlots = Record<ActionMoveName, ActionSlot>;

const initialState = (): ActionSlots => ({
  contributeJoinedProjects: ActionSlotSlice.initialState(),
  contributeOwnedProjects: ActionSlotSlice.initialState(),
  createProject: ActionSlotSlice.initialState(),
  recruit: ActionSlotSlice.initialState(),
  removeAndRefillJobs: ActionSlotSlice.initialState(),
  mirror: ActionSlotSlice.initialState(),
});

const reset = (state: ActionSlots) => {
  ActionSlotMutator.reset(state.contributeJoinedProjects);
  ActionSlotMutator.reset(state.contributeOwnedProjects);
  ActionSlotMutator.reset(state.createProject);
  ActionSlotMutator.reset(state.recruit);
  ActionSlotMutator.reset(state.removeAndRefillJobs);
  ActionSlotMutator.reset(state.mirror);
}

const ActionSlotsSlice = {
  initialState,
  mutators: {
    reset,
  },
};

export const ActionSlotsMutator = ActionSlotsSlice.mutators;
export default ActionSlotsSlice;
