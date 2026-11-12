import { PlayersSelector } from '@/game/store/slice/players';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import {
  ValidatableState,
  validateContributeJoinedProjects,
  validateContributeOwnedProjects,
  validateCreateProject,
  validateRecruit,
  validateRemoveAndRefillJobs,
} from '@/game/core/stage/action/validate';
import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';

export const PANEL_ACTIONS = [
  { name: UserActionMoves.CreateProject, title: '發起專案', en: 'START' },
  { name: UserActionMoves.ContributeOwnedProjects, title: '貢獻自己的專案', en: 'CONTRIBUTE' },
  { name: UserActionMoves.ContributeJoinedProjects, title: '貢獻他人的專案', en: 'CONTRIBUTE' },
  { name: UserActionMoves.Recruit, title: '加入專案', en: 'JOIN' },
] as const;

/** Offer an action only when at least one selection passes the server's validator. */
export function canSelectAction(G: ValidatableState, playerID: string, name: ActionMoveName): boolean {
  switch (name) {
    case 'createProject':
      return PlayersSelector.getProjectCards(G.players, playerID).some((project) =>
        G.table.jobSlots.some((job) =>
          Object.keys(project.requirements).some((profession) =>
            validateCreateProject(G, playerID, project.id, job.id, profession).valid,
          ),
        ),
      );
    case 'recruit':
      return G.table.projectBoard.some((slot) => {
        const card = slot.card;
        return card && G.table.jobSlots.some((job) =>
          Object.keys(card.requirements).some((profession) =>
            validateRecruit(G, playerID, job.id, slot.id, profession).valid,
          ),
        );
      });
    case 'contributeOwnedProjects':
    case 'contributeJoinedProjects': {
      const validate = name === 'contributeOwnedProjects'
        ? validateContributeOwnedProjects : validateContributeJoinedProjects;
      return G.table.projectBoard.some((slot) => slot.card &&
        Object.entries(slot.card.requirements).some(([jobName, required]) =>
          ProjectSlotSelector.getJobContribution(slot, jobName) < required &&
          validate(G, playerID, [{ projectSlotId: slot.id, jobName, value: 1 }]).valid,
        ),
      );
    }
    case 'removeAndRefillJobs':
      return G.table.jobSlots.some((job) => validateRemoveAndRefillJobs(G, playerID, [job.id]).valid);
  }
}
