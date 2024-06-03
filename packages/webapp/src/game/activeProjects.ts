import { PlayerID } from 'boardgame.io';
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
        .map(jobName => ActiveProject.GetJobContribution(project, jobName) >= project.card.requirements[jobName]);
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
  GetJobContribution(activeProject: ActiveProjectType, jobName: JobName): number;
  GetPlayerContribution(activeProject: ActiveProjectType, playerId: PlayerID): number;
  GetPlayerWorkerTokens(activeProject: ActiveProjectType, playerId: PlayerID): number;
  AssignWorker(activeProject: ActiveProjectType, jobName: JobName, playerId: PlayerID, points: number): void;
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
  GetJobContribution(activeProject, jobName) {
    const jobContribution = activeProject.contributions
      .filter(contribution => contribution.jobName === jobName)
      .map(contribution => contribution.value)
      .reduce((a, b) => a + b, 0);
    return jobContribution;
  },
  GetPlayerContribution(activeProject, playerId) {
    const playerContribution = activeProject.contributions
      .filter(contribution => contribution.worker === playerId)
      .map(contribution => contribution.value)
      .reduce((a, b) => a + b, 0);
    return playerContribution;
  },
  GetPlayerWorkerTokens(activeProject, playerId) {
    const ownerToken = activeProject.owner === playerId ? 1 : 0;
    const jobTokens = activeProject.contributions
      .filter(contribution => contribution.worker === playerId)
      .length;
    return ownerToken + jobTokens;
  },
  AssignWorker(activeProject, jobName, playerId, points) {
    activeProject.contributions.push({ jobName, worker: playerId, value: points });
  },
  PushWorker(activeProject, jobName, playerId, points) {
    const contribution = findContribution(activeProject.contributions, jobName, playerId);
    if (!contribution) {
      throw new Error(`${jobName} work played by ${playerId} not found in ${activeProject.card.name}`);
    }
    contribution.value += points;
  },
};
