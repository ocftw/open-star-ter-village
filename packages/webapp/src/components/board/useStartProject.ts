import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import type { GameContext } from '@/components/GameContextHelpers';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { getAssignedJobName, setAssignedJobName } from '@/lib/reducers/actionStepSlice';
import {
  getSelectedHandProjectCards,
  resetHandProjectCardSelection,
  toggleHandProjectCardSelection,
} from '@/lib/reducers/handProjectCardSlice';
import {
  getSelectedJobSlots,
  resetJobSlotSelection,
  toggleJobSlotSelection,
} from '@/lib/reducers/jobSlotSlice';
import { getStartProjectView, reconcileStartPicks, type StartPickSide } from './startProjectOrder';

export function useStartProject({ G, ctx, playerID }: GameContext, active: boolean) {
  const dispatch = useAppDispatch();
  const hand = useAppSelector(getSelectedHandProjectCards);
  const market = useAppSelector(getSelectedJobSlots);
  const assigned = useAppSelector(getAssignedJobName);
  const first = useRef<StartPickSide>('project');
  const projectId = Object.keys(hand).find((id) => hand[id]) ?? null;
  const jobId = Object.keys(market).find((id) => market[id]) ?? null;
  const session = active && playerID === ctx.currentPlayer
    ? reconcileStartPicks(G, ctx.currentPlayer, { projectId, jobId }, assigned, first.current)
    : null;

  useLayoutEffect(() => {
    if (!session) return;
    if (projectId !== session.picks.projectId) dispatch(resetHandProjectCardSelection());
    if (jobId !== session.picks.jobId) dispatch(resetJobSlotSelection());
    if (assigned !== session.assignedJobName) dispatch(setAssignedJobName(session.assignedJobName));
  }, [session, projectId, jobId, assigned, dispatch]);

  if (!session) return null;
  const { picks, assignedJobName } = session;
  const view = getStartProjectView(G, ctx.currentPlayer, picks);

  function pick(side: StartPickSide, id: string) {
    // On replacement the card that stayed in place is now the earlier pick.
    if (side === 'project') first.current = picks.jobId ? 'job' : 'project';
    else first.current = picks.projectId ? 'project' : 'job';
    dispatch(setAssignedJobName(null));
    if (side === 'project') {
      if (id !== picks.projectId) dispatch(resetHandProjectCardSelection());
      dispatch(toggleHandProjectCardSelection(id));
    } else {
      if (id !== picks.jobId) dispatch(resetJobSlotSelection());
      dispatch(toggleJobSlotSelection(id));
    }
  }

  return { picks, assignedJobName, view, pick };
}

export const StartProjectContext = createContext<ReturnType<typeof useStartProject>>(null);
export const useStartProjectSession = () => useContext(StartProjectContext);
