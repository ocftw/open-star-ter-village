import React from 'react';

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
  role,
  width = 'min(560px, 100%)',
  dataTestid,
  children,
}: {
  open: boolean;
  /** Omit to make the modal non-dismissible (no Escape/backdrop close). */
  onClose?: () => void;
  ariaLabel: string;
  /** Defaults to the dialog element's implicit role. */
  role?: 'alertdialog';
  width?: string;
  dataTestid?: string;
  children: React.ReactNode;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  // Latest onClose without re-running the open effect (React 18 does not
  // delegate the dialog element's cancel event, so it is bound manually).
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

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
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current?.();
    };
    dialog.addEventListener('cancel', handleCancel);
    dialog.showModal();
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
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
      role={role}
      data-testid={dataTestid}
      style={{ width, fontFamily: 'var(--font-zh)' }}
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
    >
      {children}
    </dialog>
  );
}
