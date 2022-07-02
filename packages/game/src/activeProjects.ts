import { PlayerID } from 'boardgame.io';
import { OpenStarTerVillageType } from './types';
import { filterInplace } from './utils';

type ProjectCard = OpenStarTerVillageType.Card.Project;
type ActiveProjects = OpenStarTerVillageType.State.Table['activeProjects'];
type ActiveProjectType = OpenStarTerVillageType.State.Project;
type JobName = OpenStarTerVillageType.JobName;

export interface IActiveProjects {
  // add a project card in active projects pool and assign it to the owner. Return the active project index
  Add(activeProjects: ActiveProjects, card: ProjectCard, owner: PlayerID): number;
  GetById(activeProjects: ActiveProjects, index: number): ActiveProjectType;
  FilterFulfilled(activeProjects: ActiveProjects): ActiveProjects;
  Remove(activeProjects: ActiveProjects, removedProjects: ActiveProjects): void;
}

export const ActiveProjects: IActiveProjects = {
  Add(activeProjects, card, owner) {
    const activeProject: ActiveProjectType = {
      card,
      owner,
      workers: [],
      contribution: { bySlot: [], byJob: {} },
      contributions: [],
    };
    activeProjects.push(activeProject);
    // return the active project index
    return activeProjects.length - 1;
  },
  GetById(activeProjects, index) {
    return activeProjects[index];
  },
  FilterFulfilled(activeProjects) {
    return activeProjects.filter(project => {
      const fulfilledThresholds = Object.keys(project.card.requirements)
        .map(jobName => project.contribution.byJob[jobName] >= project.card.thresholds[jobName]);
      return fulfilledThresholds.every(x => x);
    });
  },
  Remove(activeProjects, removedProjects) {
    filterInplace(activeProjects, project => !removedProjects.includes(project));
  },
};

export interface IActiveProject {
  HasWorker(activeProject: ActiveProjectType, jobName: JobName, playerId: PlayerID): boolean;
  GetWorkerContribution(activeProject: ActiveProjectType, jobName: JobName, playerId: PlayerID): number;
  AssignWorker(activeProject: ActiveProjectType, jobName: JobName, playerId: PlayerID, points: number): void;
  // contribute project slot with an amount of contribution points
  /**
   * @deprecated
   * @param activeProject
   * @param slotIndex
   * @param points
   */
  Contribute(activeProject: ActiveProjectType, slotIndex: number, points: number): void;
  PushWorker(activeProject: ActiveProjectType, jobName: JobName, playerId: PlayerID, points: number): void;
}

const findContribution = (contributions: ActiveProjectType['contributions'], jobName: JobName, playerId: PlayerID) =>
  contributions.find(contribution => contribution.jobName === jobName && contribution.worker === playerId);

export const ActiveProject: IActiveProject = {
  HasWorker(activeProject, jobName, playerId) {
    const contribution = findContribution(activeProject.contributions, jobName, playerId);
    return contribution !== undefined;
  },
  GetWorkerContribution(activeProject, jobName, playerId) {
    const contribution = findContribution(activeProject.contributions, jobName, playerId);
    return contribution?.value ?? 0;
  },
  AssignWorker(activeProject, jobName, playerId, points) {
    activeProject.contributions.push({ jobName, worker: playerId, value: points });
  },
  Contribute(activeProject, slotIndex, points) {
    // update contribution by slot
    activeProject.contribution.bySlot[slotIndex] += points;
    // update contribution by job
    const jobName = activeProject.card.jobs[slotIndex];
    activeProject.contribution.byJob[jobName] += points;
  },
  PushWorker(activeProject, jobName, playerId, points) {
    const contribution = findContribution(activeProject.contributions, jobName, playerId);
    if (!contribution) {
      throw new Error(`${jobName} work played by ${playerId} not found in ${activeProject.card.name}`);
    }
    contribution.value += points;
  },
};
