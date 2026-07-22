'use client';

import React from 'react';

/**
 * Sticker toast system (design: GpToasts). Top-center stack, newest last,
 * capped at 4 visible; every toast auto-dismisses and can be tapped away.
 * Kinds map to the prototype's error/success/info left-border treatments.
 */

export type ToastKind = 'error' | 'success' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

type ToastFn = (message: string, kind?: ToastKind, durationMs?: number) => void;

const ToastContext = React.createContext<ToastFn | null>(null);

const MAX_VISIBLE = 4;
const DEFAULT_DURATION_MS = 5000;

export function useToast(): ToastFn {
  const toast = React.useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextIdRef = React.useRef(0);
  const timersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = React.useCallback<ToastFn>(
    (message, kind = 'info', durationMs = DEFAULT_DURATION_MS) => {
      const id = ++nextIdRef.current;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, message, kind }]);
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      );
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-host" data-testid="toast-host">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`toast ${item.kind}`}
            role="alert"
            data-testid="toast"
            data-kind={item.kind}
            onClick={() => dismiss(item.id)}
          >
            <span aria-hidden>{item.kind === 'error' ? '⚠' : item.kind === 'success' ? '✅' : 'ⓘ'}</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
