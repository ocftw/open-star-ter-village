import { ContributeJoinedProjects } from "./contributeJoinedProjects";
import { ContributeOwnedProjects } from "./contributeOwnedProjects";
import { CreateProject } from "./createProject";
import { Recruit } from "./recruit";
import { RemoveAndRefillJobs } from "./removeAndRefillJobs";

export interface ActionMoves {
  createProject: CreateProject;
  recruit: Recruit;
  contributeOwnedProjects: ContributeOwnedProjects;
  contributeJoinedProjects: ContributeJoinedProjects;
  removeAndRefillJobs: RemoveAndRefillJobs;
};
export type ActionMoveName = keyof ActionMoves;
