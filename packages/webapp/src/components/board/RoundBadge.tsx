import { GameContext } from '@/components/GameContextHelpers';
import { RuleSelector } from '@/game/store/slice/rule';
import { TableSelector } from '@/game/store/slice/table';

/** 第 X / Y 回合 pill (design: GpRoundBadge). Hidden until the first event
 *  card starts round 1 (and in fixtures without table/rule state). */
export default function RoundBadge({
  gameContext,
  compact = false,
}: {
  gameContext: GameContext;
  compact?: boolean;
}) {
  const { G } = gameContext;
  if (!G.table) return null;
  const round = TableSelector.getRound(G.table);
  if (!round || round < 1) return null;
  const totalRounds = RuleSelector.getTotalRounds(G.rules);

  return (
    <div
      title="目前回合 · Current round"
      data-testid="round-badge"
      data-round={round}
      className="sticker"
      style={{ padding: compact ? '3px 10px' : '4px 12px', flexShrink: 0 }}
    >
      <span style={{ fontSize: compact ? 11 : 12, fontWeight: 800 }}>
        第 {round}
        <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}> / {totalRounds}</span> 回合
      </span>
      {!compact && <span className="tag-en">Round {round} of {totalRounds}</span>}
    </div>
  );
}
