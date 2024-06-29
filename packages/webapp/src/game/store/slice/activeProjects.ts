import { PlayerID } from 'boardgame.io';
import { filterInplace } from '../../utils';
import { ProjectCard } from './card';
import { ActiveProject, ActiveProjectSelector } from './activeProject/activeProject';

const initialState = (): ActiveProject[] => [];

const add = (state: ActiveProject[], card: ProjectCard, owner: PlayerID): void => {
  const activeProject: ActiveProject = {
    card,
    owner,
    contributions: [],
  };
  state.push(activeProject);
}

const remove = (state: ActiveProject[], removedProjects: ActiveProject[]): void => {
  filterInplace(state, project => !removedProjects.includes(project));
}

const getById = (state: ActiveProject[], index: number): ActiveProject => {
  return state[index];
}

const getLast = (state: ActiveProject[]): ActiveProject => {
  return state[state.length - 1];
}

const filterFulfilled = (state: ActiveProject[]): ActiveProject[] => {
  return state.filter(project => {
    const fulfilledThresholds = Object.keys(project.card.requirements)
      .map(jobName => ActiveProjectSelector.getJobContribution(project, jobName) >= project.card.requirements[jobName]);
    return fulfilledThresholds.every(x => x);
  });
}

const ActiveProjectsSlice = {
  initialState,
  mutators: {
    add,
    remove,
  },
  selectors: {
    getById,
    getLast,
    filterFulfilled,
  },
};

export const ActiveProjectsMutator = ActiveProjectsSlice.mutators;
export const ActiveProjectsSelector = ActiveProjectsSlice.selectors;
export default ActiveProjectsSlice;
