import { CharacterAvatar, getJobMetaByName } from '@/components/design';

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
};

/** JobCard: avatar + name. Selection and removal remain owned by JobMarket. */
export default function JobTile({
  id,
  name,
  selected = false,
  visualState,
  onClick,
  onRemove,
}: JobTileProps) {
  const meta = getJobMetaByName(name);
  const state = visualState ?? (selected ? 'focused' : 'default');
  const showRemove = !!onRemove && state !== 'ghost';
  const common = {
    className: 'job-tile',
    'data-testid': `job-card-${id}`,
    'data-job-name': name,
    'data-selected': selected || undefined,
    'data-visual-state': state,
  };
  const content = (
    <>
      {meta && <CharacterAvatar role={meta.role} />}
      <span className="job-tile-name">{name}</span>
    </>
  );

  return (
    <div className="job-tile-wrap">
      {showRemove || state === 'ghost' ? (
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
