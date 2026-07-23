import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, StickerButton } from '@/components/design';
import { getLobbyErrorMessage, leaveRoom } from '@/app/lobby/actions';
import { clearCredentials, loadCredentials } from '@/lib/matchCredentials';

/**
 * Leave confirmation (#420, design: GpExitDialog). Three explicit choices:
 * 回大廳 keeps the seat + credentials so the lobby offers 回到桌子 (#421);
 * 離開座位 releases the seat via leaveMatch, which terminates the match for
 * everyone (remaining players see the terminated overlay); 取消 does nothing.
 * Rendered in the shared bespoke Modal shell (no MUI).
 */
export default function ExitDialog({
  open,
  onClose,
  matchID,
}: {
  open: boolean;
  onClose: () => void;
  matchID: string;
}) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canClose = !isLeaving;

  const handleLobbyKeepSeat = () => {
    router.push('/lobby');
  };

  const handleLeaveSeat = async () => {
    const credentials = loadCredentials(matchID);
    if (!credentials) {
      // Nothing to release (observer or local play) — just go back.
      router.push('/lobby');
      return;
    }
    setIsLeaving(true);
    setError(null);
    try {
      await leaveRoom(matchID, credentials.playerID, credentials.credential);
      clearCredentials(matchID);
      router.push('/lobby');
    } catch (leaveError) {
      setError(getLobbyErrorMessage(leaveError, '無法離開座位，請稍後再試。 · Unable to leave the seat.'));
      setIsLeaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={canClose ? onClose : undefined}
      ariaLabel="離開遊戲"
      width="min(420px, 100%)"
      dataTestid="exit-dialog"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span aria-hidden style={{ fontSize: 22 }}>🚪</span>
        <div>
          <strong style={{ fontSize: 16, color: 'var(--ink)' }}>要離開嗎？</strong>
          <div className="tag-en">Leave the game?</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '6px 0 16px' }}>
        你可以回到大廳並保留座位，隨時回來繼續；或直接離席（這局遊戲會終止）。
      </p>
      {error && (
        <p role="alert" style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange-deep)', margin: '0 0 12px' }}>
          ⚠ {error}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StickerButton
          variant="teal"
          onClick={handleLobbyKeepSeat}
          disabled={isLeaving}
          style={{ width: '100%' }}
          data-testid="exit-keep-seat"
        >
          回大廳（保留座位） <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Go to lobby</span>
        </StickerButton>
        <StickerButton
          variant="ghost"
          onClick={() => void handleLeaveSeat()}
          disabled={isLeaving}
          style={{ width: '100%', borderColor: 'var(--orange-deep)', color: 'var(--orange-deep)' }}
          data-testid="exit-leave-seat"
        >
          {isLeaving ? '離開中…' : '離開座位（終止遊戲）'} <span className="tag-en">Leave seat</span>
        </StickerButton>
        <StickerButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isLeaving}
          style={{ width: '100%' }}
          data-testid="exit-cancel"
        >
          取消 <span className="tag-en">Cancel</span>
        </StickerButton>
      </div>
    </Modal>
  );
}
