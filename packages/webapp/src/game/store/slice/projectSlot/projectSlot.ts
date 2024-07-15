import { PlayerID } from "boardgame.io";
import { mutators } from "./projectSlot.mutators";
import { selectors } from "./projectSlot.selectors";
import { JobName, ProjectCard } from "../../../card";

export interface ProjectContribution {
  jobName: JobName;
  value: number
  worker: PlayerID;
}

export interface ProjectSlot {
  card: ProjectCard;
  owner: PlayerID;
  ownerToken: number;
  contributions: ProjectContribution[];
  lastContributor?: PlayerID;
}

const initialState = (): ProjectSlot => ({
  card: { id: '', name: '', requirements: {} },
  owner: '',
  ownerToken: 0,
  contributions: [],
})

const ProjectSlotSlice = {
  initialState,
  mutators,
  selectors,
};

export const ProjectSlotMutator = ProjectSlotSlice.mutators;
export const ProjectSlotSelector = ProjectSlotSlice.selectors;
export default ProjectSlotSlice;
