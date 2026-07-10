import { ReactNode, useState } from 'react';

/**
 * Mobile bottom sheet (design: MobileVariantA) — pinned to the viewport
 * bottom; the handle collapses/expands the hand strip so the board behind
 * stays readable.
 */
export default function MobileSheet({
  action,
  hand,
}: {
  /** ContextAction / DiscardPanel / waiting note */
  action: ReactNode;
  /** HandPanel strip (players only) */
  hand: ReactNode;
}) {
  // Collapsed by default: the contextual bar stays visible, the hand
  // expands over the board like a drawer (capped, internally scrollable).
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      data-testid="mobile-sheet"
      data-expanded={expanded}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        background: 'white',
        borderTop: '2px solid var(--ink)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -10px 30px -10px rgba(0,0,0,0.18)',
        padding: '6px 14px 14px',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        type="button"
        data-testid="mobile-sheet-handle"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0 6px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: 44,
            height: 4,
            background: 'var(--paper-3)',
            borderRadius: 999,
          }}
        />
        <span className="en-cap">{expanded ? '收合手牌 · Hide hand' : '展開手牌 · Show hand'}</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 0 }}>
        {action}
        {expanded && hand}
      </div>
    </div>
  );
}
