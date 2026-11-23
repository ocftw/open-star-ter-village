import type { KeyboardEvent } from 'react';
import { ProjectCard } from '@/game';
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
 * Landscape hand card (Figma Main1.1.1 你的手牌, prototype .hcard): stars and
 * the project name on the left, one requirement row per job on the right.
 * Active projects (BoardProjectSlot) use their own face with progress.
 */
export default function ProjectCardFace({
  card,
  selected = false,
  onClick,
  professionPicker,
  ...rest
}: ProjectCardFaceProps) {
  const interactive = !!onClick;
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Rows inside the card handle their own keys; only act on the card itself.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <div
      onClick={onClick}
      className={`project-card project-card--compact project-card--hand project-card--${selected ? 'focused' : 'default'}${interactive ? ' project-card--hand-interactive' : ''}`}
      data-visual-state={selected ? 'focused' : 'default'}
      data-requirements={Object.keys(card.requirements).join(',')}
      data-job-requirements={JSON.stringify(card.requirements)}
      {...(interactive && {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': selected,
        onKeyDown: handleKeyDown,
      })}
      {...rest}
    >
      <div className="project-card__hand-left">
        <span className="project-card__stars" aria-label={`難度 ${card.difficulty}`}>
          {'★'.repeat(card.difficulty)}
        </span>
        <h3 className="project-card__title">{card.name}</h3>
      </div>

      <dl className="project-card__hand-jobs project-card__jobs">
        {Object.entries(card.requirements).map(([jobName, need]) => {
          // 斜槓青年 target picking: rows become tap targets.
          const pickerEligible = !!professionPicker?.eligibleJobNames.includes(jobName);
          const pickerSelected = pickerEligible && professionPicker!.selectedJobName === jobName;
          const pick = () => professionPicker!.onPick(jobName);
          return (
            <div
              key={jobName}
              className={`project-card__hand-row${pickerEligible ? ' project-card__hand-row--target' : ''}${pickerSelected ? ' project-card__hand-row--picked' : ''}`}
              role={pickerEligible ? 'button' : undefined}
              tabIndex={pickerEligible ? 0 : undefined}
              aria-pressed={pickerEligible ? pickerSelected : undefined}
              data-testid={pickerEligible ? `profession-target-${jobName}` : undefined}
              onClick={
                pickerEligible
                  ? (e) => {
                      e.stopPropagation();
                      pick();
                    }
                  : undefined
              }
              onKeyDown={
                pickerEligible
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        pick();
                      }
                    }
                  : undefined
              }
            >
              <dt>{jobName}</dt>
              <dd>{need}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
