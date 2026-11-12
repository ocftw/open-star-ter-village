'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';
import IconButton from '@/components/design/IconButton';

/** Figma annotation on Frame 22: 跳出貢獻上限提示 / 2秒後消失. */
export const TOAST_DURATION_MS = 2000;

export type ToastProps = {
  open: boolean;
  /** Called on dismissal or once the toast has been visible for `duration` ms. */
  onClose: () => void;
  /** Change on each trigger to restart the timer and re-announce an open toast. */
  resetKey?: string | number;
  children: ReactNode;
  duration?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Transient game-room notice (Figma Frame 22, e.g.「已達到貢獻值上限」).
 * The `role="status"` live region stays mounted so screen readers announce
 * the message when it appears. Positioning is left to the caller.
 */
export default function Toast({
  open,
  onClose,
  resetKey,
  children,
  duration = TOAST_DURATION_MS,
  className,
  style,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timerRef = useRef<number>();

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    timerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [open, duration, resetKey]);

  function dismiss() {
    window.clearTimeout(timerRef.current);
    onCloseRef.current();
  }

  return (
    <div className={className} style={style}>
      <div className={open ? 'gr-toast' : undefined}>
        <span role="status" aria-live="polite" aria-atomic="true">
          {/* Replacing the message node re-announces identical notices. */}
          {open ? <span key={resetKey}>{children}</span> : null}
        </span>
        {open ? (
          <IconButton label="關閉提示" onClick={dismiss}>×</IconButton>
        ) : null}
      </div>
    </div>
  );
}
