import { StickerButton } from '@/components/design';
import type { LobbyStatus, VisibleMatch } from '@/app/lobby/actions';

export type MatchRowAction = 'return' | 'spectate' | 'join';

/**
 * Which primary action a lobby room offers this user (#421):
 * - a saved seat in the room → 回到桌子 (resume with existing credentials)
 * - another in-progress room → 觀戰 (read-only observer)
 * - otherwise → 加入 (normal join; disabled unless the room is Waiting)
 */
export function getMatchRowAction(status: LobbyStatus, hasSeat: boolean): MatchRowAction {
  if (hasSeat) return 'return';
  if (status === 'In Progress') return 'spectate';
  return 'join';
}

export default function MatchRow({
  match,
  seatsFilled,
  totalSeats,
  status,
  hasSeat,
  joining,
  busy,
  onJoin,
  onReturn,
  onSpectate,
}: {
  match: VisibleMatch['match'];
  seatsFilled: number;
  totalSeats: number;
  status: LobbyStatus;
  /** This browser holds saved credentials for a seat in the room. */
  hasSeat: boolean;
  joining: boolean;
  /** A join/create is in flight somewhere in the lobby. */
  busy: boolean;
  onJoin: () => void;
  onReturn: () => void;
  onSpectate: () => void;
}) {
  const action = getMatchRowAction(status, hasSeat);
  return (
    <div
      data-testid={`match-row-${match.matchID}`}
      data-action={action}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'white',
        border: '1.5px solid var(--ink)',
        borderRadius: 12,
        boxShadow: '0 2px 0 var(--ink)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {match.matchID}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
          {formatDate(match.createdAt)} · {status}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {Array.from({ length: totalSeats }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: i < seatsFilled ? 'var(--orange)' : 'white',
              border: '1.5px solid var(--ink)',
            }}
          />
        ))}
        <span
          style={{
            marginLeft: 4,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-en)',
          }}
        >
          {seatsFilled}/{totalSeats}
        </span>
      </div>
      {action === 'return' && (
        <StickerButton size="sm" onClick={onReturn} disabled={busy} data-testid="match-return">
          回到桌子 · Return
        </StickerButton>
      )}
      {action === 'spectate' && (
        <StickerButton variant="ghost" size="sm" onClick={onSpectate} disabled={busy} data-testid="match-spectate">
          觀戰 · Spectate
        </StickerButton>
      )}
      {action === 'join' && (
        <StickerButton
          variant="teal"
          size="sm"
          onClick={onJoin}
          disabled={status !== 'Waiting' || busy}
          data-testid="match-join"
        >
          {joining ? '加入中… · Joining' : '加入 · Join'}
        </StickerButton>
      )}
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}
