import { PlayerID } from "boardgame.io";
import { EventCard, JobCard, ProjectCard } from "../cards/card";
import { ActionMoves, Contribution } from "../moves/actionMoves";

export interface ProjectContribution extends Contribution {
  worker: PlayerID;
}

export interface Project {
  card: ProjectCard;
  owner: PlayerID;
  contributions: ProjectContribution[];
}

export type ActiveActionMoves = Record<keyof ActionMoves, boolean>;

export interface Table {
  activeEvent: EventCard | null;
  activeProjects: Project[];
  activeJobs: JobCard[];
  activeActionMoves: ActiveActionMoves;
}

export const setupTable = (): Table => {
  return {
    activeEvent: null,
    activeProjects: [],
    activeJobs: [],
    activeActionMoves: {
      contributeJoinedProjects: true,
      contributeOwnedProjects: true,
      createProject: true,
      recruit: true,
      removeAndRefillJobs: true,
      mirror: true,
    },
  };
}
