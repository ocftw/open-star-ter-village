/**
 * Shown to everyone who is not on turn. While the current player owes the
 * 四大自由 discard, the note says so instead of the generic "waiting" text.
 */
export default function WaitingForPlayerAlert({
  playerName,
  pendingDiscard,
}: {
  playerName: string;
  pendingDiscard: boolean;
}) {
  return (
    <div
      data-testid="waiting-for-player-alert"
      data-pending-discard={pendingDiscard}
      role="status"
      className="paper-card"
      style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        color: 'var(--ink-soft)',
        ...(pendingDiscard ? { borderLeft: '8px solid var(--proj-data)' } : {}),
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: pendingDiscard ? 'var(--proj-data)' : 'var(--orange)',
          flexShrink: 0,
        }}
      />
      {pendingDiscard ? (
        <span>
          <strong style={{ color: 'var(--ink)' }}>
            🕊️ 等待 {playerName} 移除 2 張人力卡（四大自由）
          </strong>{' '}
          <span className="en-cap">Waiting for {playerName} to discard 2 job cards (Four freedoms)</span>
        </span>
      ) : (
        <>
          等待 {playerName} 行動中… Waiting for {playerName}…
        </>
      )}
    </div>
  );
}
