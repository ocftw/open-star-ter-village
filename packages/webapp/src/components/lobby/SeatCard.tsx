import React from 'react';
import { PLAYER_COLORS, StickerButton } from '@/components/design';

type BotStrategyOption = { id: string; label: string };

type SeatCardProps = {
  seatIndex: number;
  playerName?: string;
  isHost?: boolean;
  isYou?: boolean;
  /** Strategy label when the seat holds a bot. */
  botLabel?: string;
  /** Host only: offered on an empty seat to seat a bot. */
  onAddBot?: (strategyId: string) => void;
  botStrategies?: BotStrategyOption[];
  /** Host only: offered on a bot seat to free it. */
  onRemoveBot?: () => void;
  busy?: boolean;
};

function AddBotControl({ seatIndex, strategies, onAdd, busy }: { seatIndex: number; strategies: BotStrategyOption[]; onAdd: (id: string) => void; busy: boolean }) {
  const [strategy, setStrategy] = React.useState(strategies[0]?.id ?? '');
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
      {strategies.length > 1 && (
        <select aria-label={`Seat ${seatIndex} 電腦策略 Bot strategy`} value={strategy} onChange={(e) => setStrategy(e.target.value)} disabled={busy}>
          {strategies.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      )}
      <StickerButton variant="ghost" size="sm" data-testid={`seat-${seatIndex}-add-bot`} disabled={busy} onClick={() => onAdd(strategy)}>
        ＋ 電腦 · Add bot
      </StickerButton>
    </div>
  );
}

export default function SeatCard({
  seatIndex,
  playerName,
  isHost = false,
  isYou = false,
  botLabel,
  onAddBot,
  botStrategies = [],
  onRemoveBot,
  busy = false,
}: SeatCardProps) {
  if (!playerName) {
    return (
      <div
        className="hatch"
        data-testid={`seat-${seatIndex}-empty`}
        style={{
          height: 108,
          border: '2px dashed var(--ink-mute)',
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink-mute)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {!onAddBot && <div style={{ fontSize: 22 }}>＋</div>}
          <div>Seat {seatIndex}</div>
          {onAddBot && botStrategies.length > 0 && (
            <AddBotControl seatIndex={seatIndex} strategies={botStrategies} onAdd={onAddBot} busy={busy} />
          )}
        </div>
      </div>
    );
  }

  const seatColor = PLAYER_COLORS[seatIndex % PLAYER_COLORS.length];
  return (
    <div
      data-testid={`seat-${seatIndex}-filled`}
      style={{
        height: 108,
        background: 'white',
        border: '2px solid var(--ink)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-sticker)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
      }}
    >
      {isHost && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 10,
            background: 'var(--orange)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 999,
            border: '1.5px solid var(--ink)',
            boxShadow: '0 2px 0 var(--ink)',
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          HOST 房主
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: seatColor,
            color: 'white',
            border: '2px solid var(--ink)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-en)',
            fontWeight: 800,
            fontSize: 14,
            boxShadow: '0 2px 0 var(--ink)',
            flexShrink: 0,
          }}
        >
          {playerName[0]?.toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playerName}
          </div>
          <div className="en-cap">
            Seat {seatIndex}
            {isYou ? ' · YOU' : ''}
            {botLabel ? ' · BOT' : ''}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {botLabel ? (
          <span className="sticker" data-testid={`seat-${seatIndex}-bot`} style={{ background: 'var(--teal-soft)', borderColor: 'var(--ink)', whiteSpace: 'nowrap' }}>
            🤖 {botLabel}
          </span>
        ) : (
          <span className="sticker" style={{ background: '#dcf3e3', borderColor: '#1f7a3a', color: '#1f7a3a' }}>
            ✓ 已入座 Seated
          </span>
        )}
      </div>
      {onRemoveBot && (
        <button
          type="button"
          data-testid={`seat-${seatIndex}-remove-bot`}
          aria-label={`移除 Seat ${seatIndex} 電腦 Remove bot`}
          title="移除電腦 Remove bot"
          disabled={busy}
          onClick={onRemoveBot}
          style={{
            // 44×44 hit area around a 26px visual, matching the seat-card target size from #425.
            position: 'absolute',
            top: 0,
            right: 0,
            width: 44,
            height: 44,
            padding: 0,
            border: 'none',
            background: 'transparent',
            display: 'grid',
            placeItems: 'center',
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '1.5px solid var(--ink)',
              background: 'white',
              boxShadow: '0 2px 0 var(--ink)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            ✕
          </span>
        </button>
      )}
    </div>
  );
}
