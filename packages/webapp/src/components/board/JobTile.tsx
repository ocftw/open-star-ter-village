import { CharacterAvatar, getJobMetaByName } from '@/components/design';

type JobTileProps = {
  id: string;
  name: string;
  selected?: boolean;
  onClick?: () => void;
};

/** Compact job-market tile (design: JobCardB). */
export default function JobTile({ id, name, selected = false, onClick }: JobTileProps) {
  const meta = getJobMetaByName(name);
  return (
    <div
      data-testid={`job-card-${id}`}
      data-job-name={name}
      onClick={onClick}
      style={{
        background: 'white',
        border: selected ? '2.5px solid var(--orange)' : '2px solid var(--ink)',
        borderRadius: 14,
        boxShadow: selected ? '0 4px 0 var(--orange)' : 'var(--shadow-soft)',
        padding: 10,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: 'transform 0.1s',
        transform: selected ? 'translateY(-3px)' : 'none',
      }}
    >
      {meta && <CharacterAvatar role={meta.role} />}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
        {name}
      </div>
    </div>
  );
}
