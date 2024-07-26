import { ProjectCard } from '../../card';
import ProjectSlotSlice, { ProjectSlot, ProjectSlotSelector } from './projectSlot/projectSlot';

export type ProjectBoard = ProjectSlot[];

const initialState = (): ProjectSlot[] => [];

const initialize = (state: ProjectSlot[], maxProjectSlots: number): void => {
  for (let i = 0; i < maxProjectSlots; i++) {
    const slotId = `project-slot-${i}`;
    state.push(ProjectSlotSlice.initialState(slotId));
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
    const slotIndexToBeRemoved = state.findIndex(slot => slot.id === removeSlot.id);
    if (slotIndexToBeRemoved === -1) {
      throw new Error('Project slot not found');
    }
    state[slotIndexToBeRemoved] = ProjectSlotSlice.initialState(removeSlot.id);
  });
}

const getById = (state: ProjectSlot[], index: number): ProjectSlot => {
  return state[index];
}

const getBySlotId = (state: ProjectSlot[], id: string): ProjectSlot | undefined => {
  const slot = state.find(project => project.id === id);
  return slot;
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
    getBySlotId,
    getSlotByCard,
    getRequirementFulfilled,
  },
};

export const ProjectBoardMutator = ProjectBoardSlice.mutators;
export const ProjectBoardSelector = ProjectBoardSlice.selectors;
export default ProjectBoardSlice;
