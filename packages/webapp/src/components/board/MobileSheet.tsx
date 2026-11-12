import { ReactNode, useState } from 'react';
import { IconButton } from '@/components/design';

/** Mobile stacks the actions and collapsible hand in normal document flow. */
export default function MobileSheet({
  action,
  hand,
}: {
  action: ReactNode;
  hand: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      data-testid="mobile-sheet"
      data-expanded={expanded}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 12, minWidth: 0 }}
    >
      {action}
      {hand && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconButton
              label={expanded ? '收合手牌 · Hide hand' : '展開手牌 · Show hand'}
              data-testid="mobile-sheet-handle"
              aria-expanded={expanded}
              aria-controls="mobile-hand"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? '⌃' : '⌄'}
            </IconButton>
            <span style={{ fontSize: 12, fontWeight: 700 }}>你的手牌</span>
          </div>
          <div id="mobile-hand" hidden={!expanded}>{hand}</div>
        </>
      )}
    </div>
  );
}
