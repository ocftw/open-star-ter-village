import { PlayerID } from "boardgame.io";
import { OpenStarTerVillageType } from "./types";

type ProjectCard = OpenStarTerVillageType.Card.Project;
type ActiveProjects = OpenStarTerVillageType.State.Table['activeProjects'];
type ActiveProjectType = OpenStarTerVillageType.State.Project;

export interface IActiveProjects {
  // add a project card in active projects pool and assign it to the owner. Return the active project index
  Add(activeProjects: ActiveProjects, card: ProjectCard, owner: PlayerID): number;
  GetById(activeProjects: ActiveProjects, index: number): ActiveProjectType;
}

export const ActiveProjects: IActiveProjects = {
  Add(activeProjects, card, owner) {
    // init workers
    const workers: ActiveProjectType['workers'] = card.jobs.map(_ => null);
    const bySlot: ActiveProjectType['contribution']['bySlot'] = card.jobs.map(_ => 0);
    const byJob = card.jobs.reduce<ActiveProjectType['contribution']['byJob']>((result, job) => {
      result[job] = 0;
      return result;
    }, {});
    const activeProject: ActiveProjectType = {
      card,
      owner,
      workers,
      contribution: { bySlot, byJob },
    };
    activeProjects.push(activeProject);
    // return the active project index
    return activeProjects.length - 1;
  },
  GetById(activeProjects, index) {
    return activeProjects[index];
  },
};
