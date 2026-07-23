import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Bespoke sticker modal (prototype .modal / .modal-backdrop) — the no-MUI
 * dialog shell. Portaled to <body> to escape sticky-header stacking
 * contexts, with Escape/backdrop close (when onClose is provided), initial
 * focus, a small Tab cycle, and body scroll lock while open.
 */
export default function Modal({
  open,
  onClose,
  ariaLabel,
  width = 'min(560px, 100%)',
  dataTestid,
  children,
}: {
  open: boolean;
  /** Omit to make the modal non-dismissible (no Escape/backdrop close). */
  onClose?: () => void;
  ariaLabel: string;
  width?: string;
  dataTestid?: string;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose?.();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    // Keep Tab cycling inside the panel.
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        data-testid={dataTestid}
        style={{ width, fontFamily: 'var(--font-zh)', outline: 'none' }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
