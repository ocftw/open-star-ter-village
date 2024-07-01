import { PlayerID } from "boardgame.io";
import { mutators } from "./projectSlot.mutators";
import { selectors } from "./projectSlot.selectors";
import { Contribution } from "../../../moves/type";
import { ProjectCard } from "../card";

export interface ProjectContribution extends Contribution {
  worker: PlayerID;
}

export interface ProjectSlot {
  card: ProjectCard;
  owner: PlayerID;
  contributions: ProjectContribution[];
}

const initialState = (): ProjectSlot => ({
  card: { name: '', requirements: {} },
  owner: '',
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
