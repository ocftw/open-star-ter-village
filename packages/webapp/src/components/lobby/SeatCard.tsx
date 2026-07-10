import { PLAYER_COLORS } from '@/components/design';

type SeatCardProps = {
  seatIndex: number;
  playerName?: string;
  isHost?: boolean;
  isYou?: boolean;
};

export default function SeatCard({
  seatIndex,
  playerName,
  isHost = false,
  isYou = false,
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
          <div style={{ fontSize: 22 }}>＋</div>
          <div>Seat {seatIndex}</div>
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
          </div>
        </div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <span className="sticker" style={{ background: '#dcf3e3', borderColor: '#1f7a3a', color: '#1f7a3a' }}>
          ✓ 已入座 Seated
        </span>
      </div>
    </div>
  );
}
