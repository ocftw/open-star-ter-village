import { PlayerID } from 'boardgame.io';
import { filterInplace } from '../utils';
import { JobName, ProjectCard } from '../cards/card';
import { Project, ProjectContribution } from './table';

export interface IActiveProjects {
  // add a project card in active projects pool and assign it to the owner. Return the active project index
  Add(activeProjects: Project[], card: ProjectCard, owner: PlayerID): number;
  GetById(activeProjects: Project[], index: number): Project;
  FilterFulfilled(activeProjects: Project[]): Project[];
  Remove(activeProjects: Project[], removedProjects: Project[]): void;
}

export const ActiveProjects: IActiveProjects = {
  Add(activeProjects, card, owner) {
    const activeProject: Project = {
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
  HasWorker(activeProject: Project, jobName: JobName, playerId: PlayerID): boolean;
  GetWorkerContribution(activeProject: Project, jobName: JobName, playerId: PlayerID): number;
  GetJobContribution(activeProject: Project, jobName: JobName): number;
  GetPlayerContribution(activeProject: Project, playerId: PlayerID): number;
  GetPlayerWorkerTokens(activeProject: Project, playerId: PlayerID): number;
  AssignWorker(activeProject: Project, jobName: JobName, playerId: PlayerID, points: number): void;
  PushWorker(activeProject: Project, jobName: JobName, playerId: PlayerID, points: number): void;
}

const findContribution = (contributions: ProjectContribution[], jobName: JobName, playerId: PlayerID) =>
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
    const contribution: ProjectContribution = { jobName, worker: playerId, value: points };
    activeProject.contributions.push(contribution);
  },
  PushWorker(activeProject, jobName, playerId, points) {
    const contribution = findContribution(activeProject.contributions, jobName, playerId);
    if (!contribution) {
      throw new Error(`${jobName} work played by ${playerId} not found in ${activeProject.card.name}`);
    }
    contribution.value += points;
  },
};
