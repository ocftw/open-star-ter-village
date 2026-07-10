import { ProjectCard } from '@/game';
import { CharacterAvatar, getJobMetaByName, getProjectTypeMetaByName } from '@/components/design';

type ProjectCardFaceProps = {
  card: ProjectCard;
  /** contributed amount per job name (omit for hand cards — shows 0/need) */
  contributed?: Record<string, number>;
  selected?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
};

/**
 * Portrait project card (design: ProjectCardA) — used for the hand and
 * anywhere a full card face is needed.
 */
export default function ProjectCardFace({
  card,
  contributed,
  selected = false,
  onClick,
  ...rest
}: ProjectCardFaceProps) {
  const typeMeta = getProjectTypeMetaByName(card.type);
  return (
    <div
      onClick={onClick}
      data-requirements={Object.keys(card.requirements).join(',')}
      {...rest}
      style={{
        position: 'relative',
        width: '100%',
        background: 'white',
        border: selected ? '2.5px solid var(--orange)' : '2px solid var(--ink)',
        borderRadius: 18,
        boxShadow: selected ? '0 4px 0 var(--orange)' : 'var(--shadow-sticker)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s ease',
        transform: selected ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* type stripe */}
      <div
        style={{
          background: typeMeta?.color ?? 'var(--ink-soft)',
          color: 'white',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--ink)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'white' }} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{card.type}</span>
        </div>
        <div style={{ display: 'flex', gap: 3 }} aria-label={`難度 ${card.difficulty}`}>
          {Array.from({ length: card.difficulty }).map((_, i) => (
            <span key={i} style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>
              ★
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        <div
          style={{
            fontFamily: 'var(--font-zh)',
            fontWeight: 900,
            fontSize: 17,
            lineHeight: 1.15,
            color: 'var(--ink)',
          }}
        >
          {card.name}
        </div>
        {typeMeta && (
          <div className="tag-en" style={{ marginTop: 3 }}>
            {typeMeta.en}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {Object.entries(card.requirements).map(([jobName, need]) => {
            const jobMeta = getJobMetaByName(jobName);
            const done = contributed?.[jobName] ?? 0;
            return (
              <div
                key={jobName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: jobMeta?.softColor ?? 'var(--paper-2)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 999,
                  padding: '3px 10px 3px 3px',
                }}
              >
                {jobMeta && <CharacterAvatar role={jobMeta.role} size="sm" />}
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{jobName}</span>
                <span style={{ fontFamily: 'var(--font-en)', fontWeight: 800, fontSize: 12 }}>
                  {done}/{need}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
