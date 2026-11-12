import { CharacterAvatar, getJobMetaByName } from '@/components/design';

type JobTileProps = {
  id: string;
  name: string;
  selected?: boolean;
  visualState?: 'default' | 'focused' | 'generalHint' | 'change';
  onClick?: () => void;
};

/** JobCard: avatar + name. Selection remains owned by JobMarket. */
export default function JobTile({
  id,
  name,
  selected = false,
  visualState,
  onClick,
}: JobTileProps) {
  const meta = getJobMetaByName(name);
  const state = visualState ?? (selected ? 'focused' : 'default');
  // Figma state annotations were unavailable: assume ring/lift for Focused,
  // dashed warm hint for GeneralHint, muted swap cue for Change (visual only).
  return (
    <button
      type="button"
      className="job-tile"
      data-testid={`job-card-${id}`}
      data-job-name={name}
      data-selected={selected || undefined}
      data-visual-state={state}
      aria-label={name}
      aria-pressed={selected}
      disabled={!onClick}
      onClick={onClick}
    >
      {meta && <CharacterAvatar role={meta.role} />}
      <span className="job-tile-name">{name}</span>
      {state === 'change' && (
        <span className="job-tile-change" aria-hidden="true" title="即將更換">
          ↻
        </span>
      )}
    </button>
  );
}
