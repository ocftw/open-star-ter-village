'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

/** Figma annotation on Frame 22: 跳出貢獻上限提示 / 2秒後消失. */
export const TOAST_DURATION_MS = 2000;

export type ToastProps = {
  open: boolean;
  /** Called once the toast has been visible for `duration` ms. */
  onClose: () => void;
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
  children,
  duration = TOAST_DURATION_MS,
  className,
  style,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration]);

  return (
    <div role="status" aria-live="polite" className={className} style={style}>
      {open ? <div className="gr-toast">{children}</div> : null}
    </div>
  );
}
