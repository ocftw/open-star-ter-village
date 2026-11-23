'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { RuleSelector } from '@/game/store/slice/rule';
import { useAppSelector } from '@/lib/hooks';
import { getCurrentAction } from '@/lib/reducers/actionStepSlice';
import {
  REFILL_TIMING,
  RefillPending,
  RefillPhase,
  RefillSequence,
  RefillView,
  buildRefillView,
  isRefillAccepted,
  splitAccepted,
} from './refillFlowModel';

type FlowState = { phase: RefillPhase; pending: RefillPending | null; sequence: RefillSequence | null };
const IDLE: FlowState = { phase: 'idle', pending: null, sequence: null };

export type RefillFlowApi = {
  /** Null outside a pending/accepted refill: the market then renders G directly. */
  view: RefillView | null;
  /** A confirmed refill is still waiting for G or animating; DONE stays disabled. */
  busy: boolean;
  begin: (pending: RefillPending) => void;
  /** 「已更換成新人力」 toast, opened by the last landing. */
  toastKey: number | null;
  closeToast: () => void;
  /** #520 score popup 「影響力+N」, separate from the toast. */
  popup: { key: number; amount: number } | null;
};

const INERT: RefillFlowApi = {
  view: null, busy: false, begin: () => undefined, toastKey: null, closeToast: () => undefined, popup: null,
};
const RefillFlowContext = createContext<RefillFlowApi>(INERT);
export const useRefillFlow = () => useContext(RefillFlowContext);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Client-only state for a confirmed 換人力: the pre-confirm snapshot (it must
 * survive resetAction), acceptance detection against G, and the
 * empty → slide-left → one-at-a-time deal sequence that ends in the toast.
 */
export function RefillFlowProvider({ gameContext, children }: { gameContext: GameContext; children: React.ReactNode }) {
  const { G, ctx, playerID } = gameContext;
  const currentAction = useAppSelector(getCurrentAction);
  const [state, setState] = useState<FlowState>(IDLE);
  const [toastKey, setToastKey] = useState<number | null>(null);
  const [popup, setPopup] = useState<RefillFlowApi['popup']>(null);
  const timers = useRef<number[]>([]);
  const guard = useRef<{ turn: number; playerID: string | null; currentPlayer: string } | null>(null);
  const counter = useRef(0);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  const reset = useCallback(() => {
    clearTimers();
    guard.current = null;
    setState(IDLE);
    setToastKey(null);
    setPopup(null);
  }, [clearTimers]);

  const begin = useCallback((pending: RefillPending) => {
    clearTimers();
    setToastKey(null);
    setPopup(null);
    guard.current = { turn: pending.turn, playerID: pending.playerID, currentPlayer: pending.currentPlayer };
    setState({ phase: 'awaiting', pending, sequence: null });
    // Rejected / unrelated G never matches: give the originals back.
    later(() => {
      guard.current = null;
      setState((s) => (s.phase === 'awaiting' ? IDLE : s));
    }, REFILL_TIMING.reject);
  }, [clearTimers, later]);

  const finish = useCallback(() => {
    guard.current = null;
    setState(IDLE);
    setToastKey(++counter.current);
  }, []);

  const runSequence = useCallback((pending: RefillPending, split: Pick<RefillSequence, 'survivors' | 'incoming'>) => {
    const { survivors, incoming } = split;
    setState({ phase: 'emptying', pending, sequence: { survivors, incoming, dealt: 0 } });
    later(() => {
      setState({ phase: 'shifting', pending, sequence: { survivors, incoming, dealt: 0 } });
    }, REFILL_TIMING.empty);
    const dealStart = REFILL_TIMING.empty + REFILL_TIMING.shift;
    later(() => {
      if (incoming.length === 0) return finish();
      setState({ phase: 'dealing', pending, sequence: { survivors, incoming, dealt: 0 } });
    }, dealStart);
    incoming.forEach((_, index) => {
      later(() => {
        if (index + 1 >= incoming.length) return finish();
        setState({ phase: 'dealing', pending, sequence: { survivors, incoming, dealt: index + 1 } });
      }, dealStart + REFILL_TIMING.deal * (index + 1));
    });
  }, [finish, later]);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Acceptance, and every cleanup trigger that is not an acceptance.
  useEffect(() => {
    const current = stateRef.current;
    if (current.phase === 'idle' || !current.pending) return;
    if (current.phase === 'awaiting' && isRefillAccepted(current.pending, G, playerID)) {
      clearTimers();
      guard.current = { turn: ctx.turn, playerID, currentPlayer: ctx.currentPlayer };
      const split = splitAccepted(current.pending, G);
      const amount = RuleSelector.getActionVictoryPoints(G.rules, 'removeAndRefillJobs');
      setPopup({ key: ++counter.current, amount });
      later(() => setPopup(null), REFILL_TIMING.popup);
      if (prefersReducedMotion()) {
        // Acceptance only: faces appear in place, already in survivors-then-new order.
        finish();
      } else {
        runSequence(current.pending, split);
      }
      return;
    }
    const g = guard.current;
    if (g && (g.turn !== ctx.turn || g.playerID !== playerID || g.currentPlayer !== ctx.currentPlayer)) reset();
  }, [G, ctx.turn, ctx.currentPlayer, playerID, clearTimers, finish, later, reset, runSequence]);

  // Choosing another action while a refill is in flight drops the animation.
  useEffect(() => {
    if (currentAction !== null && stateRef.current.phase !== 'idle') reset();
  }, [currentAction, reset]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const view = useMemo<RefillView | null>(
    () => (state.phase !== 'idle' && state.pending ? buildRefillView(state.phase, state.pending, state.sequence) : null),
    [state],
  );
  const closeToast = useCallback(() => setToastKey(null), []);
  const api = useMemo<RefillFlowApi>(
    () => ({ view, busy: state.phase !== 'idle', begin, toastKey, closeToast, popup }),
    [view, state.phase, begin, toastKey, closeToast, popup],
  );

  return <RefillFlowContext.Provider value={api}>{children}</RefillFlowContext.Provider>;
}
