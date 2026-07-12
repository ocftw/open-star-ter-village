import React from 'react';
import Link from 'next/link';
import Logo from './Logo';

/**
 * Shared application-header shell for lobby and game surfaces.
 * Owns the brand block, bar height, background, padding, and divider so both
 * surfaces read as the same shell; callers supply their right-side content.
 * The lobby header is the visual source of truth.
 */
export default function AppHeader({
  right,
  sticky = false,
  compact = false,
}: {
  right?: React.ReactNode;
  sticky?: boolean;
  compact?: boolean;
}) {
  return (
    <header
      data-testid="app-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 14,
        minHeight: compact ? 52 : 72,
        padding: compact ? '0 12px' : '0 36px',
        background: 'var(--paper)',
        borderBottom: '1.5px solid var(--paper-3)',
        ...(sticky && { position: 'sticky' as const, top: 0, zIndex: 10 }),
      }}
    >
      <Link href="/" aria-label="回首頁 Home" style={{ flexShrink: 0 }}>
        {/* Compact bars keep only the star tile so player chips get the width. */}
        <Logo size={compact ? 'sm' : 'md'} iconOnly={compact} />
      </Link>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flex: 1,
          minWidth: 0,
          gap: compact ? 8 : 14,
        }}
      >
        {right}
      </div>
    </header>
  );
}
