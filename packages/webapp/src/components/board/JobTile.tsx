import type React from 'react';
import { CharacterAvatar, getJobMetaByName } from '@/components/design';
import { isSlashWildJobCard } from '@/game/core/slashWildJob';

type JobTileProps = {
  id: string;
  name: string;
  selected?: boolean;
  /**
   * `change`: remove mode, not yet removed (full colour + red ×).
   * `ghost`: already removed in remove mode (dashed, faded, no ×).
   */
  visualState?: 'default' | 'focused' | 'generalHint' | 'change' | 'ghost';
  /** Tile body is the control (select / recruit / create). Ignored while the × is shown. */
  onClick?: () => void;
  /** Remove mode: the × is the control; the tile body is not. */
  onRemove?: () => void;
  /**
   * Entry/exit motion. `deal` is the 換人力 entry: a face-up flight from the
   * deal origin (never translateY(100%)). `drop-out` is reserved for event release.
   */
  motion?: 'drop-out' | 'deal';
  /** Delay in ms before the motion starts. */
  motionDelay?: number;
  /** Local .26s shrink of the OLD identity right after × (inert, no ×), before it becomes a ghost. */
  shrinking?: boolean;
};

/** JobCard: avatar + name. Selection and removal remain owned by JobMarket. */
export default function JobTile({
  id,
  name,
  selected = false,
  visualState,
  onClick,
  onRemove,
  motion,
  motionDelay,
  shrinking = false,
}: JobTileProps) {
  const wild = isSlashWildJobCard({ id, name });
  const meta = wild ? undefined : getJobMetaByName(name);
  const state = visualState ?? (selected ? 'focused' : 'default');
  const showRemove = !!onRemove && state !== 'ghost' && !shrinking;
  const common = {
    className: 'job-tile',
    'data-testid': `job-card-${id}`,
    'data-job-name': name,
    'data-wild': wild || undefined,
    'data-selected': selected || undefined,
    'data-visual-state': state,
    'data-motion': motion,
    'data-shrinking': shrinking || undefined,
  };
  const nameLabel = <span className="job-tile-name">{name}</span>;
  const content = wild ? (
    <span className="job-tile-face" data-testid={`job-face-${id}`}>
      <span className="job-char job-char--slash" aria-hidden="true">斜</span>
      {nameLabel}
      <span className="job-tile-sub">可作為任一人力使用</span>
    </span>
  ) : (
    <>
      {meta && <CharacterAvatar role={meta.role} />}
      {nameLabel}
    </>
  );

  return (
    <div
      className="job-tile-wrap"
      data-job-id={id}
      data-motion={motion}
      style={motionDelay ? ({ '--motion-delay': `${motionDelay}ms` } as React.CSSProperties) : undefined}
    >
      {showRemove || state === 'ghost' || shrinking ? (
        // Not a button: the × is a sibling control, so no nested interactives.
        <div
          {...common}
          role="group"
          aria-label={state === 'ghost' ? `${name}（已移除）` : name}
        >
          {content}
        </div>
      ) : (
        <button
          type="button"
          {...common}
          aria-label={name}
          aria-pressed={selected}
          disabled={!onClick}
          onClick={onClick}
        >
          {content}
        </button>
      )}
      {showRemove && (
        <button
          type="button"
          className="job-remove"
          data-testid={`job-remove-${id}`}
          aria-label={`移除 ${name}`}
          onClick={onRemove}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
            <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
