import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JobCard } from '@/game';

/**
 * Prototype market motion, reusing its two keyframes (see globals.css):
 * leaving tiles `dropOut` (.4s, 40ms stagger), then entering tiles `pushUp`
 * (.45s, 60ms stagger). Covers refill, 人力釋出, recruit refills and the 四大自由
 * discard. Under `prefers-reduced-motion: reduce` nothing is animated or held back.
 */
export const DROP_MS = 400;
export const DROP_STAGGER_MS = 40;
export const PUSH_MS = 450;
export const PUSH_STAGGER_MS = 60;

export type MarketRow = {
  job: JobCard;
  motion?: 'push-in' | 'drop-out';
  delay?: number;
};

type Anim = {
  prevIds: string[];
  leaving: string[];
  entering: string[];
  phase: 'leave' | 'enter';
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const batchMs = (count: number, duration: number, stagger: number) =>
  count > 0 ? duration + stagger * (count - 1) : 0;

/**
 * @param jobs   tiles currently rendered, in order (discard-marked tiles excluded)
 * @param ghostIds tiles currently shown as removed ghosts (換人力). A ghost is
 *                 already "gone" visually, so it leaves silently when refilled.
 */
export function useJobMarketMotion(jobs: JobCard[], ghostIds: ReadonlySet<string>): MarketRow[] {
  const seen = useRef(new Map<string, JobCard>());
  jobs.forEach((job) => seen.current.set(job.id, job));
  const committed = useRef<string[] | null>(null);
  const lastGhosts = useRef<ReadonlySet<string>>(new Set());
  const [anim, setAnim] = useState<Anim | null>(null);
  const idsKey = jobs.map((job) => job.id).join('|');

  useIsoLayoutEffect(() => {
    const prev = committed.current;
    const cur = jobs.map((job) => job.id);
    committed.current = cur;
    if (prev === null || prev.length === 0 || prefersReducedMotion()) {
      setAnim(null);
      return;
    }
    const leaving = prev.filter((id) => !cur.includes(id) && !lastGhosts.current.has(id));
    const entering = cur.filter((id) => !prev.includes(id));
    if (leaving.length === 0 && entering.length === 0) {
      setAnim(null);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const enterMs = batchMs(entering.length, PUSH_MS, PUSH_STAGGER_MS);
    const finish = () => timers.push(setTimeout(() => setAnim(null), enterMs));
    if (leaving.length > 0) {
      setAnim({ prevIds: prev, leaving, entering, phase: 'leave' });
      timers.push(
        setTimeout(() => {
          setAnim((a) => (a ? { ...a, phase: 'enter' } : a));
          finish();
        }, batchMs(leaving.length, DROP_MS, DROP_STAGGER_MS)),
      );
    } else {
      setAnim({ prevIds: prev, leaving, entering, phase: 'enter' });
      finish();
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Declared after the diff effect so it still reads the previous commit's ghosts there.
  useIsoLayoutEffect(() => {
    lastGhosts.current = ghostIds;
  });

  const byId = new Map(jobs.map((job) => [job.id, job]));
  if (anim?.phase === 'leave') {
    return anim.prevIds.flatMap((id): MarketRow[] => {
      const leaveIndex = anim.leaving.indexOf(id);
      if (leaveIndex >= 0) {
        const job = seen.current.get(id);
        return job ? [{ job, motion: 'drop-out', delay: leaveIndex * DROP_STAGGER_MS }] : [];
      }
      const job = byId.get(id);
      return job ? [{ job }] : [];
    });
  }
  return jobs.map((job): MarketRow => {
    const index = anim?.entering.indexOf(job.id) ?? -1;
    return index >= 0 ? { job, motion: 'push-in', delay: index * PUSH_STAGGER_MS } : { job };
  });
}
