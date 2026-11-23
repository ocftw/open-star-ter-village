import React from 'react';
import type { GameContext } from '@/components/GameContextHelpers';

/** Fallback for a move the server rejects without a new state. */
export const MOVE_PENDING_TIMEOUT_MS = 8_000;

/**
 * Every OSV move is `client: false` (see docs/evidence/issue-445/move-inventory.md):
 * the client never runs it locally, so it would otherwise look frozen until
 * the server broadcast arrives. Wrap the moves so dispatching one shows an
 * immediate pending visual; the next authoritative state (new G or ctx)
 * clears it. Nothing is predicted, so no hidden state is invented.
 */
export function useMovePending(context: GameContext): { gameContext: GameContext; movePending: boolean } {
  const [pending, setPending] = React.useState(false);
  const { G, ctx, moves } = context;

  React.useEffect(() => {
    setPending(false);
  }, [G, ctx]);

  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setPending(false), MOVE_PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const wrappedMoves = React.useMemo(() => {
    const wrapped: typeof moves = {};
    for (const [name, move] of Object.entries(moves)) {
      wrapped[name] = (...args: unknown[]) => {
        setPending(true);
        return move(...args);
      };
    }
    return wrapped;
  }, [moves]);

  const gameContext = React.useMemo(() => ({ ...context, moves: wrappedMoves }), [context, wrappedMoves]);
  return { gameContext, movePending: pending };
}

export function MovePendingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="move-pending"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        zIndex: 1200,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
        padding: '6px 14px',
        borderRadius: 999,
        background: 'white',
        border: '1.5px solid var(--ink)',
        boxShadow: '0 2px 0 var(--ink)',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-soft)',
        whiteSpace: 'nowrap',
      }}
    >
      ⏳ 等待伺服器回應… <span className="en-cap">Waiting for the server</span>
    </div>
  );
}
