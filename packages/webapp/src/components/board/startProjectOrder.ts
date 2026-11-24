import type { PlayerID } from 'boardgame.io';
import type { JobCard, ProjectCard } from '@/game';
import { isLiveSlashWildJobCard, isSlashWildJobCard, requiresAssignedJobName } from '@/game/core/slashWildJob';
import { validateCreateProject, type ValidatableState } from '@/game/core/stage/action/validate';
import { PlayersSelector } from '@/game/store/slice/players';
import { canPass } from './actionPanel';

/**
 * 發起專案 reorder (#497). Pure: everything is derived from the CURRENT G and
 * the pending selections, never stored, so a change in G re-applies.
 *
 * match = the job is one the project names;
 * wild = the 斜槓青年 card or a legacy override, requiring a profession choice;
 * disabled = unusable with the selected counterpart.
 */
export type StartTier = 'match' | 'wild' | 'disabled';
export type StartEntry<T> = { card: T; tier: StartTier };
export type StartPicks = { projectId: string | null; jobId: string | null };
export type StartPickSide = 'project' | 'job';
export type StartView = {
  hand: StartEntry<ProjectCard>[];
  market: StartEntry<JobCard>[];
};

const TIER_RANK: Record<StartTier, number> = { match: 0, wild: 1, disabled: 2 };

function isAvailableStartJob(G: ValidatableState, playerID: PlayerID, currentPlayer: PlayerID, job: JobCard): boolean {
  return !isSlashWildJobCard(job) || (playerID === currentPlayer && isLiveSlashWildJobCard(G, currentPlayer, job));
}

/** Tier of one (project, job) pair, using the same validator the move runs. */
export function pairTier(
  G: ValidatableState,
  playerID: PlayerID,
  currentPlayer: PlayerID,
  project: ProjectCard,
  job: JobCard,
): StartTier {
  if (!isAvailableStartJob(G, playerID, currentPlayer, job)) return 'disabled';
  const requirements = Object.keys(project.requirements);
  const wild = requiresAssignedJobName(G.rules, playerID, job, requirements);
  // START can use any required profession for a wild pair, so one is enough to probe.
  const assigned = wild ? requirements[0] : undefined;
  if (!canPass((opts) => validateCreateProject(G, playerID, project.id, job.id, assigned, opts, currentPlayer))) {
    return 'disabled';
  }
  return wild ? 'wild' : 'match';
}

/** Stable partition by tier: G order is kept inside each group. */
function partition<T>(entries: StartEntry<T>[]): StartEntry<T>[] {
  return entries.sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
}

export function getStartProjectView(
  G: ValidatableState,
  playerID: PlayerID,
  currentPlayer: PlayerID,
  picks: StartPicks,
): StartView {
  const projects = PlayersSelector.getProjectCards(G.players, playerID);
  const jobs = G.table.jobSlots.filter((card) => isAvailableStartJob(G, playerID, currentPlayer, card));
  const project = projects.find((card) => card.id === picks.projectId);
  const job = jobs.find((card) => card.id === picks.jobId);
  const probe = project ?? projects[0];
  const worker = job ?? jobs[0];
  // Global blockers belong to preflight. A pick with no matches must still
  // disable the opposite rail when START itself is available.
  if (probe && worker && (project || job) && !canPass((opts) => {
    const result = validateCreateProject(G, playerID, probe.id, worker.id, undefined, opts, currentPlayer);
    if (!result.valid && (
      result.reason === 'PROJECT_JOB_NOT_REQUIRED' || result.reason === 'PROFESSION_TARGET_REQUIRED' ||
      result.reason === 'JOB_CARD_NOT_ON_TABLE'
    )) {
      return { valid: true };
    }
    return result;
  })) {
    return {
      hand: projects.map((card) => ({ card, tier: 'match' })),
      market: jobs.map((card) => ({ card, tier: 'match' })),
    };
  }

  return {
    hand: partition(
      projects.map((card) => ({
        card,
        tier: job ? pairTier(G, playerID, currentPlayer, card, job) : 'match',
      })),
    ),
    market: partition(
      jobs.map((card) => ({
        card,
        tier: project ? pairTier(G, playerID, currentPlayer, project, card) : 'match',
      })),
    ),
  };
}

/** Whether the selected pair needs a profession choice. */
export function isWildPair(G: ValidatableState, playerID: PlayerID, currentPlayer: PlayerID, picks: StartPicks): boolean {
  const project = picks.projectId ? PlayersSelector.getProjectCardById(G.players, playerID, picks.projectId) : undefined;
  const job = G.table.jobSlots.find((card) => card.id === picks.jobId);
  return !!project && !!job && isAvailableStartJob(G, playerID, currentPlayer, job) &&
    requiresAssignedJobName(G.rules, playerID, job, Object.keys(project.requirements));
}

export type StartReconcile = { picks: StartPicks; assignedJobName: string | null };

/**
 * Drop vanished cards first. When the remaining pair is incompatible, the
 * earlier pick drives both lists.
 */
export function reconcileStartPicks(
  G: ValidatableState,
  playerID: PlayerID,
  currentPlayer: PlayerID,
  current: StartPicks,
  assignedJobName: string | null,
  first: StartPickSide,
): StartReconcile {
  const project = current.projectId
    ? PlayersSelector.getProjectCardById(G.players, playerID, current.projectId)
    : undefined;
  const job = G.table.jobSlots.find((card) =>
    card.id === current.jobId && isAvailableStartJob(G, playerID, currentPlayer, card),
  );
  const picks = { projectId: project?.id ?? null, jobId: job?.id ?? null };
  if (!project || !job) {
    return { picks, assignedJobName: null };
  }
  const requirements = Object.keys(project.requirements);
  if (requiresAssignedJobName(G.rules, playerID, job, requirements)) {
    return {
      picks,
      assignedJobName: assignedJobName && requirements.includes(assignedJobName) ? assignedJobName : null,
    };
  }
  if (requirements.includes(job.name)) return { picks, assignedJobName: null };
  return {
    picks: first === 'project' ? { ...picks, jobId: null } : { ...picks, projectId: null },
    assignedJobName: null,
  };
}
