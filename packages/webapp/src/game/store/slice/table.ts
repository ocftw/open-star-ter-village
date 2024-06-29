import { EventCard, JobCard } from "./card";
import { ActionMoves } from "../../moves/actionMoves";
import ActiveProjectsSlice from "./activeProjects";
import { ActiveProject } from "./activeProject/activeProject";

export type ActiveActionMoves = Record<keyof ActionMoves, boolean>;

export interface Table {
  activeEvent: EventCard | null;
  activeProjects: ActiveProject[];
  activeJobs: JobCard[];
  activeActionMoves: ActiveActionMoves;
}

const initialState = (): Table => ({
  activeEvent: null,
  activeProjects: ActiveProjectsSlice.initialState(),
  activeJobs: [],
  activeActionMoves: {
    contributeJoinedProjects: true,
    contributeOwnedProjects: true,
    createProject: true,
    recruit: true,
    removeAndRefillJobs: true,
    mirror: true,
  },
});

const TableSlice = {
  initialState,
};

export default TableSlice;
