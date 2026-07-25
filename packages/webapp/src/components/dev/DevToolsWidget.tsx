'use client';

import React from 'react';
import { useIsMobile } from '@/lib/useIsMobile';
import type { DevPerspective, DevTransport } from '@/components/dev/devConfig';

const PERSPECTIVE_OPTIONS: ReadonlyArray<{
  value: DevPerspective;
  label: string;
}> = [
  { value: 'player1', label: 'Alice · Player 1' },
  { value: 'player2', label: 'Bob · Player 2' },
  { value: 'player3', label: 'Charlie · Player 3' },
  { value: 'observer', label: 'Observer' },
];

export interface DevToolsWidgetProps {
  perspective: DevPerspective;
  transport: DevTransport;
  onPerspectiveChange: (perspective: DevPerspective) => void;
  onTransportChange: (transport: DevTransport) => void;
  hasLocalSetupOverrides?: boolean;
}

export default function DevToolsWidget({
  perspective,
  transport,
  onPerspectiveChange,
  onTransportChange,
  hasLocalSetupOverrides = false,
}: DevToolsWidgetProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const anchor = isMobile ? 'bottom' : 'right';

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Open developer controls"
          data-testid="dev-tools-open"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            right: isMobile ? 12 : 20,
            top: isMobile ? 72 : 'auto',
            bottom: isMobile ? 'auto' : 20,
            zIndex: 1301,
            width: 40,
            height: 40,
            border: '2px solid var(--ink)',
            borderRadius: '50%',
            background: 'var(--orange)',
            color: 'var(--ink)',
            boxShadow: '0 3px 0 var(--ink)',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          <span aria-hidden="true">⚙</span>
        </button>
      )}

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1299,
              background: 'rgb(0 0 0 / 32%)',
            }}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-tools-title"
            data-testid="dev-tools-drawer"
            data-anchor={anchor}
            style={{
              position: 'fixed',
              zIndex: 1300,
              right: 0,
              bottom: 0,
              top: isMobile ? 'auto' : 0,
              left: isMobile ? 0 : 'auto',
              width: isMobile ? 'auto' : 320,
              maxHeight: isMobile ? '80vh' : '100vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 20,
              border: '2px solid var(--ink)',
              borderRight: isMobile ? '2px solid var(--ink)' : 0,
              borderBottom: 0,
              borderRadius: isMobile ? '22px 22px 0 0' : 0,
              background: '#fffaf2',
              color: 'var(--ink)',
              boxShadow: '0 0 24px rgb(0 0 0 / 22%)',
            }}
          >
            <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 20 }}>
                ⚙
              </span>
              <h2
                id="dev-tools-title"
                style={{ flex: 1, margin: 0, fontSize: 20, fontWeight: 800 }}
              >
                Developer controls
              </h2>
              <button
                type="button"
                aria-label="Close developer controls"
                data-testid="dev-tools-close"
                onClick={() => setOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 28,
                  lineHeight: 1,
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>
              Switch perspective without leaving the current match.
            </p>

            <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #d8d1c7' }} />

            <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
              <legend style={{ marginBottom: 8, fontWeight: 700 }}>Perspective</legend>
              {PERSPECTIVE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  data-testid={`dev-perspective-${option.value}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 40,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="dev-perspective"
                    value={option.value}
                    checked={perspective === option.value}
                    onChange={() => onPerspectiveChange(option.value)}
                    style={{ width: 18, height: 18, accentColor: 'var(--orange)' }}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>

            <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #d8d1c7' }} />

            <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
              <legend style={{ marginBottom: 8, fontWeight: 700 }}>Transport</legend>
              {(
                [
                  ['offline', 'Offline · Local'],
                  ['online', 'Online · SocketIO'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  data-testid={`dev-transport-${value}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 40,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="dev-transport"
                    value={value}
                    checked={transport === value}
                    onChange={() => onTransportChange(value)}
                    style={{ width: 18, height: 18, accentColor: 'var(--orange)' }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <p style={{ margin: '12px 0 0', color: '#666', fontSize: 12 }}>
              Changing transport starts a fresh three-player match.
            </p>
            {hasLocalSetupOverrides && (
              <p style={{ margin: '8px 0 0', color: '#9b5d00', fontSize: 12 }}>
                Seed and demo overrides apply only in Offline mode.
              </p>
            )}
          </aside>
        </>
      )}
    </>
  );
}
