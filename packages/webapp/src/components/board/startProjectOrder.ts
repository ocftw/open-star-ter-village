import type { PlayerID } from 'boardgame.io';
import type { JobCard, ProjectCard } from '@/game';
import { validateCreateProject, type ValidatableState } from '@/game/core/stage/action/validate';
import { PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { canPass } from './actionPanel';

/**
 * 發起專案 reorder (#497). Pure: everything is derived from the CURRENT G and
 * the pending selections, never stored, so a change in G re-applies.
 *
 * match = the job is one the project names; slash = only usable through the
 * 斜槓青年 event entitlement (an entitlement on a real worker, not a card);
 * disabled = unusable with the selected counterpart.
 */
export type StartTier = 'match' | 'slash' | 'disabled';
export type StartEntry<T> = { card: T; tier: StartTier };
export type StartPicks = { projectId: string | null; jobId: string | null };
export type StartPickSide = 'project' | 'job';
export type StartView = {
  hand: StartEntry<ProjectCard>[];
  market: StartEntry<JobCard>[];
};

const TIER_RANK: Record<StartTier, number> = { match: 0, slash: 1, disabled: 2 };

/** Tier of one (project, job) pair, using the same validator the move runs. */
export function pairTier(
  G: ValidatableState,
  playerID: PlayerID,
  project: ProjectCard,
  job: JobCard,
): StartTier {
  if (canPass((opts) => validateCreateProject(G, playerID, project.id, job.id, undefined, opts))) {
    return 'match';
  }
  const viaSlash = Object.keys(project.requirements).some((profession) =>
    canPass((opts) => validateCreateProject(G, playerID, project.id, job.id, profession, opts)),
  );
  return viaSlash ? 'slash' : 'disabled';
}

/** Stable partition by tier: G order is kept inside each group. */
function partition<T>(entries: StartEntry<T>[]): StartEntry<T>[] {
  return entries.sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
}

export function getStartProjectView(
  G: ValidatableState,
  playerID: PlayerID,
  picks: StartPicks,
): StartView {
  const projects = PlayersSelector.getProjectCards(G.players, playerID);
  const jobs = G.table.jobSlots;
  const project = projects.find((card) => card.id === picks.projectId);
  const job = jobs.find((card) => card.id === picks.jobId);
  const probe = project ?? projects[0];
  const worker = job ?? jobs[0];
  // Global blockers belong to preflight. A pick with no matches must still
  // disable the opposite rail when START itself is available.
  if (probe && worker && (project || job) && !canPass((opts) => {
    const result = validateCreateProject(G, playerID, probe.id, worker.id, undefined, opts);
    if (!result.valid && (result.reason === 'PROJECT_JOB_NOT_REQUIRED' || result.reason === 'PROFESSION_TARGET_REQUIRED')) {
      return { valid: true };
    }
    return result;
  })) {
    return {
      hand: projects.map((card) => ({ card, tier: 'match' })),
      market: jobs.map((card) => ({ card, tier: 'match' })),
    };
  }

  // A selected card stays enabled even if a stale counterpart makes it unusable.
  const enabled = (tier: StartTier, selected: boolean): StartTier =>
    selected && tier === 'disabled' ? 'slash' : tier;
  return {
    hand: partition(
      projects.map((card) => ({
        card,
        tier: job ? enabled(pairTier(G, playerID, card, job), card.id === picks.projectId) : 'match',
      })),
    ),
    market: partition(
      jobs.map((card) => ({
        card,
        tier: project ? enabled(pairTier(G, playerID, project, card), card.id === picks.jobId) : 'match',
      })),
    ),
  };
}

/** Requirement names the 斜槓青年 picker offers (deduplicated, card order). */
export function slashTargetNames(project: ProjectCard): string[] {
  return Object.keys(project.requirements);
}

/** Both slots filled, the job is not one the project names, and the entitlement is on. */
export function isSlashPair(G: ValidatableState, playerID: PlayerID, picks: StartPicks): boolean {
  const project = picks.projectId ? PlayersSelector.getProjectCardById(G.players, playerID, picks.projectId) : undefined;
  const job = G.table.jobSlots.find((card) => card.id === picks.jobId);
  if (!project || !job) return false;
  return !Object.keys(project.requirements).includes(job.name)
    && RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);
}

export type StartReconcile = { picks: StartPicks; assignedJobName: string | null };

/**
 * Invalidation after G (or the entitlement) changes under a pending pick.
 * `first` is the earlier pick; when a mismatch loses its entitlement the later
 * pick goes and the earlier one drives both lists.
 */
export function reconcileStartPicks(
  G: ValidatableState,
  playerID: PlayerID,
  current: StartPicks,
  assignedJobName: string | null,
  first: StartPickSide,
): StartReconcile {
  const project = current.projectId
    ? PlayersSelector.getProjectCardById(G.players, playerID, current.projectId)
    : undefined;
  const job = current.jobId ? G.table.jobSlots.find((card) => card.id === current.jobId) : undefined;
  const picks = { projectId: project?.id ?? null, jobId: job?.id ?? null };
  if (!project || !job || Object.keys(project.requirements).includes(job.name)) {
    return { picks, assignedJobName: null };
  }
  if (RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID)) {
    return {
      picks,
      assignedJobName: assignedJobName && slashTargetNames(project).includes(assignedJobName) ? assignedJobName : null,
    };
  }
  return {
    picks: first === 'project' ? { ...picks, jobId: null } : { ...picks, projectId: null },
    assignedJobName: null,
  };
}
