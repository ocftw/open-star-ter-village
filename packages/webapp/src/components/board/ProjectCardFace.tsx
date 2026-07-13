import { ProjectCard } from '@/game';
import { CharacterAvatar, getJobMetaByName, getProjectTypeMetaByName } from '@/components/design';
import { ProfessionPicker } from './professionPicker';

type ProjectCardFaceProps = {
  card: ProjectCard;
  selected?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
  /** 斜槓青年: makes requirement rows tappable target positions. */
  professionPicker?: ProfessionPicker;
};

/**
 * Portrait project card (design: ProjectCardA) — the requirement-only face
 * used for hand cards. Active projects (BoardProjectSlot) show progress.
 */
export default function ProjectCardFace({
  card,
  selected = false,
  onClick,
  professionPicker,
  ...rest
}: ProjectCardFaceProps) {
  const typeMeta = getProjectTypeMetaByName(card.type);
  return (
    <div
      onClick={onClick}
      data-requirements={Object.keys(card.requirements).join(',')}
      data-job-requirements={JSON.stringify(card.requirements)}
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
            // 斜槓青年 target picking: rows become tap targets.
            const pickerEligible = !!professionPicker?.eligibleJobNames.includes(jobName);
            const pickerSelected = pickerEligible && professionPicker!.selectedJobName === jobName;
            return (
              <div
                key={jobName}
                role={pickerEligible ? 'button' : undefined}
                aria-pressed={pickerEligible ? pickerSelected : undefined}
                data-testid={pickerEligible ? `profession-target-${jobName}` : undefined}
                onClick={
                  pickerEligible
                    ? (e) => {
                        e.stopPropagation();
                        professionPicker!.onPick(jobName);
                      }
                    : undefined
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: pickerSelected ? 'var(--orange-soft)' : jobMeta?.softColor ?? 'var(--paper-2)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 999,
                  padding: '3px 10px 3px 3px',
                  ...(pickerEligible && {
                    outline: pickerSelected ? '2px solid var(--orange)' : '2px dashed var(--orange)',
                    cursor: 'pointer',
                  }),
                }}
              >
                {jobMeta && <CharacterAvatar role={jobMeta.role} size="sm" />}
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{jobName}</span>
                <span style={{ fontFamily: 'var(--font-en)', fontWeight: 800, fontSize: 12 }}>
                  ×{need}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
