import { useEffect } from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { clearJobSlotsInteractive, setJobSlotsInteractive } from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';

/**
 * 四大自由 forced discard: the last player removes 2 job cards before ending
 * their turn. Shown instead of ContextAction (logic unchanged from the old
 * DiscardJobCardsPanel; sticker restyle).
 */
export default function DiscardPanel({ gameContext }: { gameContext: GameContext }) {
  const { moves } = gameContext as GameContext & {
    moves: { discardExcessJobCards: (cardIds: string[]) => void };
  };
  const dispatch = useAppDispatch();
  const selected = useAppSelector(getSelectedJobSlots);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  useEffect(() => {
    dispatch(setJobSlotsInteractive());
    return () => {
      dispatch(clearJobSlotsInteractive());
      dispatch(resetJobSlotSelection());
    };
  }, [dispatch]);

  const isConfirmEnabled = selectedIds.length === 2;

  return (
    <div
      data-testid="discard-job-cards-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'white',
        border: '2px solid var(--ink)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-sticker)',
        padding: '10px 16px',
        borderLeft: '8px solid var(--proj-data)',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          background: 'var(--proj-data)',
          color: 'white',
          border: '1.5px solid var(--ink)',
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        🕊️
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <strong style={{ fontSize: 15 }}>四大自由：棄掉 2 張人力卡</strong>
          <span className="en-cap">Four freedoms · discard</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>
          結束回合前，點選人力市場中要移除的 2 張卡。
          <span data-testid="discard-progress" style={{ fontWeight: 700, marginLeft: 8 }}>
            {selectedIds.length} / 2
          </span>
        </div>
      </div>
      <button
        type="button"
        data-testid="discard-confirm"
        className="btn-sticker sm"
        style={{ background: 'var(--proj-data)' }}
        disabled={!isConfirmEnabled}
        onClick={() => {
          moves.discardExcessJobCards(selectedIds);
          dispatch(resetJobSlotSelection());
        }}
      >
        確認棄牌
      </button>
    </div>
  );
}
