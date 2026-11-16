import { PlayerID } from 'boardgame.io';
import { ProjectCard, ProjectSlotState } from '@/game';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { getEligibleTargetJobNames } from './professionPicker';

/**
 * Presentational mirror of the job-matching part of validateCreateProject /
 * validateRecruit (prototype `.jtile.disabled`). It only dims tiles the current
 * selection cannot use; the shared validators still own every rule on confirm.
 *
 * `override` is the 斜槓青年 entitlement: a mismatched job may then target any
 * open position, so no tile is dimmed for not matching.
 */
export type JobEligibilityContext =
  | { action: 'createProject'; card?: ProjectCard; override: boolean }
  | { action: 'recruit'; slot?: ProjectSlotState; playerID: PlayerID | null; override: boolean };

/** True when nothing is selected yet, or the job can be used with the selection. */
export const isJobEligible = (jobName: string, ctx: JobEligibilityContext): boolean => {
  if (ctx.action === 'createProject') {
    if (!ctx.card || ctx.override) return true;
    return Object.keys(ctx.card.requirements).includes(jobName);
  }
  const { slot, playerID } = ctx;
  if (!slot?.card || playerID === null) return true;
  const required = slot.card.requirements;
  if (jobName in required) {
    return (
      !ProjectSlotSelector.hasWorker(slot, jobName, playerID) &&
      ProjectSlotSelector.getJobContribution(slot, jobName) < required[jobName]
    );
  }
  return ctx.override && getEligibleTargetJobNames(slot, playerID).length > 0;
};
