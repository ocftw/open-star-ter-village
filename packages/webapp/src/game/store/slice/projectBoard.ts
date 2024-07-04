import { filterInplace } from '../../utils';
import { ProjectCard } from '../../card';
import ProjectSlotSlice, { ProjectSlot, ProjectSlotSelector } from './projectSlot/projectSlot';

export type ProjectBoard = ProjectSlot[];

const initialState = (): ProjectSlot[] => [];

const add = (state: ProjectSlot[], card: ProjectCard): void => {
  const projectSlot = ProjectSlotSlice.initialState();
  projectSlot.card = card;

  state.push(projectSlot);
}

const remove = (state: ProjectSlot[], removedProjects: ProjectSlot[]): void => {
  filterInplace(state, project => !removedProjects.includes(project));
}

const getById = (state: ProjectSlot[], index: number): ProjectSlot => {
  return state[index];
}

const getLast = (state: ProjectSlot[]): ProjectSlot => {
  return state[state.length - 1];
}

const filterFulfilled = (state: ProjectSlot[]): ProjectSlot[] => {
  return state.filter(project => {
    const fulfilledThresholds = Object.keys(project.card.requirements)
      .map(jobName => ProjectSlotSelector.getJobContribution(project, jobName) >= project.card.requirements[jobName]);
    return fulfilledThresholds.every(x => x);
  });
}

const ProjectBoardSlice = {
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

export const ProjectBoardMutator = ProjectBoardSlice.mutators;
export const ProjectBoardSelector = ProjectBoardSlice.selectors;
export default ProjectBoardSlice;
