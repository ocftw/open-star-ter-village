import React from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
  + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bespoke sticker modal (prototype .modal) — the no-MUI dialog shell, built
 * on the native <dialog> element. showModal() supplies top-layer rendering,
 * an inert background (a real focus trap), Escape via the cancel event, and
 * focus restoration to the invoking element on close. Backdrop clicks close
 * it when onClose is provided; body scroll locks via CSS while open.
 */
export default function Modal({
  open,
  onClose,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  role,
  width = 'min(560px, 100%)',
  style,
  dataTestid,
  children,
}: {
  open: boolean;
  /** Omit to make the modal non-dismissible (no Escape/backdrop close). */
  onClose?: () => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  /** Defaults to the dialog element's implicit role. */
  role?: 'alertdialog';
  width?: string;
  style?: React.CSSProperties;
  dataTestid?: string;
  children: React.ReactNode;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) {
      return;
    }
    // Restore focus to the invoking control on close. Explicit rather than
    // relying on <dialog>'s native restoration, which StrictMode's
    // mount→cleanup→remount disturbs (the cleanup close() re-homes focus
    // before the remount records its invoker).
    const invoker = document.activeElement as HTMLElement | null;
    // Escape fires `cancel`; always preventDefault and let React drive the
    // unmount (which calls close()). Dismissal is never wired to the `close`
    // event: close() is queued as a task, so under StrictMode's
    // mount→cleanup→remount the cleanup's close() would deliver a stray close
    // to the remounted dialog and tear it right back down.
    dialog.showModal();
    return () => {
      dialog.close();
      if (invoker && document.contains(invoker)) {
        invoker.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      role={role}
      data-testid={dataTestid}
      tabIndex={-1}
      style={{ width, fontFamily: 'var(--font-zh)', ...style }}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      onClick={(event) => {
        // ::backdrop clicks target the dialog element itself; a click inside
        // the panel's bounding box (e.g. its padding) must not dismiss.
        const dialog = dialogRef.current;
        if (!onClose || !dialog || event.target !== dialog) {
          return;
        }
        const rect = dialog.getBoundingClientRect();
        const inPanel =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inPanel) {
          onClose();
        }
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== 'Tab') {
          return;
        }
        const candidates = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => element.offsetParent !== null);
        const focusable = candidates.filter((element) => {
          if (!(element instanceof HTMLInputElement) || element.type !== 'radio') {
            return true;
          }
          const checkedInGroup = candidates.some(
            (candidate) =>
              candidate instanceof HTMLInputElement
              && candidate.type === 'radio'
              && candidate.name === element.name
              && candidate.checked,
          );
          return element.checked || !checkedInGroup;
        });
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {children}
    </dialog>
  );
}
