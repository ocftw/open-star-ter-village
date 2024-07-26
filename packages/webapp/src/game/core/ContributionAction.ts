import { JobName } from "../card";
import { ProjectSlotID } from "../store/slice/projectSlot/projectSlot";


export interface ContributionAction {
  jobName: JobName;
  value: number;
  projectSlotId: ProjectSlotID;
}

export const getTotalContributionValue = (contributions: ContributionAction[]): number => {
  return contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
};
