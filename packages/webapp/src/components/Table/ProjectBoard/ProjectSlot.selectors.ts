import { JobName, ProjectSlotID } from "@/game";
import { ContributionAction } from "@/game/core/ContributionAction";
import { isJoinedContributionInteractive, isOwnedContributionInteractive, isProjectSlotsInteractive } from "@/lib/reducers/actionStepSlice";
import { getContributions, updateContribute } from "@/lib/reducers/contributionSlice";
import { getSelectedProjectSlots, toggleProjectSlotSelection } from "@/lib/reducers/projectSlotSlice";
import { AppDispatch } from "@/lib/store";
import { createSelector } from "@reduxjs/toolkit";

export interface StateProps {
  isInteractive: boolean;
  selectedSlots: Record<ProjectSlotID, boolean>;
  isOwnedInteractive: boolean;
  isJoinedInteractive: boolean;
}

export const mapStateToProps = createSelector(
  isProjectSlotsInteractive,
  getSelectedProjectSlots,
  isOwnedContributionInteractive,
  isJoinedContributionInteractive,
  (isInteractive, selectedSlots, isOwnedInteractive, isJoinedInteractive): StateProps => ({
    isInteractive,
    selectedSlots,
    isOwnedInteractive,
    isJoinedInteractive,
  })
);

export interface DispatchProps {
  toggleProjectSlotSelection: (slotId: ProjectSlotID) => void;
  updateContribution: (slotId: ProjectSlotID, jobName: JobName, diffAmount: number) => void;
}

export const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  toggleProjectSlotSelection: (slotId) => {
    dispatch(toggleProjectSlotSelection(slotId));
  },
  updateContribution: (slotId, jobName, diffAmount) => {
    dispatch(updateContribute({ slotId, jobName, diffAmount }));
  },
});
