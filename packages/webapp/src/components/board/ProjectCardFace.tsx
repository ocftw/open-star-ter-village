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
      className={`project-card project-card--compact project-card--${selected ? 'focused' : 'default'}`}
      data-visual-state={selected ? 'focused' : 'default'}
      data-requirements={Object.keys(card.requirements).join(',')}
      data-job-requirements={JSON.stringify(card.requirements)}
      {...rest}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="project-card__tag">
        <span className="project-card__type">
          <span className="project-card__type-dot" style={{ background: typeMeta?.color ?? 'var(--ink-soft)' }} />
          {card.type}
        </span>
        <span className="project-card__stars" aria-label={`難度 ${card.difficulty}`}>
          {'★'.repeat(card.difficulty)}
        </span>
      </div>

      <div>
        <h3 className="project-card__title">{card.name}</h3>
        {typeMeta && (
          <div className="tag-en" style={{ marginTop: 3 }}>
            {typeMeta.en}
          </div>
        )}

        <div className="project-card__jobs" style={{ marginTop: 10 }}>
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
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{jobName}</span>
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
