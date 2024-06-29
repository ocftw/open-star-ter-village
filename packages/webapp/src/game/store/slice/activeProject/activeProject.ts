import { PlayerID } from "boardgame.io";
import { mutators } from "./activeProject.mutators";
import { selectors } from "./activeProject.selectors";
import { Contribution } from "../../../moves/actionMoves";
import { ProjectCard } from "../card";

export interface ProjectContribution extends Contribution {
  worker: PlayerID;
}

export interface ActiveProject {
  card: ProjectCard;
  owner: PlayerID;
  contributions: ProjectContribution[];
}

const initialState = (): ActiveProject => ({
  card: { name: '', requirements: {} },
  owner: '',
  contributions: [],
})

const ActiveProjectSlice = {
  initialState,
  mutators,
  selectors,
};

export const ActiveProjectMutator = ActiveProjectSlice.mutators;
export const ActiveProjectSelector = ActiveProjectSlice.selectors;
export default ActiveProjectSlice;
