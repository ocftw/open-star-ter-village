import { ReactNode } from 'react';

type NoteTone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<NoteTone, { bg: string; border: string; ink: string }> = {
  info: { bg: 'var(--teal-soft)', border: 'var(--teal-deep)', ink: 'var(--teal-deep)' },
  success: { bg: '#dcf3e3', border: '#1f7a3a', ink: '#1f7a3a' },
  warning: { bg: 'var(--orange-soft)', border: 'var(--orange-deep)', ink: 'var(--orange-deep)' },
  error: { bg: '#f8dcd7', border: 'var(--proj-data)', ink: 'var(--proj-data)' },
};

type NoteProps = {
  tone?: NoteTone;
  children: ReactNode;
  'data-testid'?: string;
};

/** Sticker-style inline alert replacing MUI <Alert> on redesigned screens. */
export default function Note({ tone = 'info', children, ...rest }: NoteProps) {
  const colors = TONES[tone];
  return (
    <div
      role="status"
      {...rest}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '10px 16px',
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 12,
        boxShadow: '0 2px 0 ' + colors.border,
        fontSize: 13,
        lineHeight: 1.5,
        color: colors.ink,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
