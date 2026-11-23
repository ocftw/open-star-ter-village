import { Button } from '@/components/design';

export default function ContributionConfirmBar({
  total, max, canConfirm, confirmLabel = '確認貢獻', error, onCancel, onConfirm,
}: {
  total: number;
  max: number;
  canConfirm: boolean;
  confirmLabel?: string;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (total <= 0) return null;

  return (
    <div className="contribution-confirm" data-testid="contribution-confirm-bar" role="group" aria-label="貢獻確認">
      <div className="contribution-confirm__summary">
        <strong>貢獻 +{total}</strong>
        <span>最多 +{max}</span>
        <span>剩餘 {max - total}</span>
      </div>
      <div className="contribution-confirm__actions">
        <Button size="small" variant="sec" data-testid="contribution-cancel-pending" onClick={onCancel}>
          取消
        </Button>
        <Button size="small" data-testid="ca-confirm" onClick={onConfirm} disabled={!canConfirm}>
          {confirmLabel}
        </Button>
      </div>
      {error && <p className="contribution-confirm__error" role="status" data-testid="preflight-error">{error}</p>}
    </div>
  );
}
