import { ProjectCard } from '../../card';
import ProjectSlotSlice, { ProjectSlot, ProjectSlotSelector } from './projectSlot/projectSlot';

export type ProjectBoard = ProjectSlot[];

const initialState = (): ProjectSlot[] => [];

const initialize = (state: ProjectSlot[], maxProjectSlots: number): void => {
  for (let i = 0; i < maxProjectSlots; i++) {
    state.push(ProjectSlotSlice.initialState());
  }
}

const add = (state: ProjectSlot[], card: ProjectCard): void => {
  const firstEmptySlot = state.find(project => !project.card);
  if (!firstEmptySlot) {
    throw new Error('No empty project slot');
  }
  firstEmptySlot.card = card;
}

const remove = (state: ProjectSlot[], removedSlots: ProjectSlot[]): void => {
  removedSlots.forEach(removeSlot => {
  let slotToBeRemoved = state.find(slot => slot.card?.id === removeSlot.card?.id && slot.owner === removeSlot.owner);
    if (!slotToBeRemoved) {
      throw new Error('Project slot not found');
    }
    slotToBeRemoved = ProjectSlotSlice.initialState();
  });
}

const getById = (state: ProjectSlot[], index: number): ProjectSlot => {
  return state[index];
}

const getSlotByCard = (state: ProjectSlot[], card: ProjectCard): ProjectSlot => {
  const slot = state.find(project => project.card?.id === card.id);
  if (!slot) {
    throw new Error('Project slot not found');
  }
  return slot;
}

const getRequirementFulfilled = (state: ProjectSlot[]): ProjectSlot[] => {
  return state.filter(project => {
    if (!project.card) {
      return false;
    }
    for (const jobName in project.card.requirements) {
      if (ProjectSlotSelector.getJobContribution(project, jobName) < project.card.requirements[jobName]) {
        return false;
      }
    }
    return true;
  });
}

const ProjectBoardSlice = {
  initialState,
  mutators: {
    initialize,
    add,
    remove,
  },
  selectors: {
    getById,
    getSlotByCard,
    getRequirementFulfilled,
  },
};

export const ProjectBoardMutator = ProjectBoardSlice.mutators;
export const ProjectBoardSelector = ProjectBoardSlice.selectors;
export default ProjectBoardSlice;
