import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton, Modal } from '@/components/design';
import type { JobCard, ProjectCard } from '@/game';
import CloseIcon from '@/components/design/CloseIcon';
import JobTile from './JobTile';
import ProjectCardFace from './ProjectCardFace';
import { slashTargetNames } from './startProjectOrder';

function SlashPicker({ project, assignment, onAssign }: {
  project: ProjectCard;
  assignment: string | null;
  onAssign: (name: string) => void;
}) {
  const [open, setOpen] = useState(!assignment);
  const title = '把斜槓青年指派為哪個人力？';
  const close = () => setOpen(false);
  return (
    <div className="start-project__assignment">
      <Button variant="sec" data-testid="start-assign" onClick={() => setOpen(true)}>
        {assignment ? `已指派：${assignment}` : '選擇指派人力'}
      </Button>
      <Modal open={open} onClose={close} ariaLabel={title} dataTestid="start-slash-picker">
        <h2>{title}</h2>
        <div className="start-project__targets">
          {slashTargetNames(project).map((name) => (
            <Button key={name} aria-pressed={assignment === name} variant="sec" onClick={() => {
              onAssign(name);
              close();
            }}>
              {name}
            </Button>
          ))}
          <Button variant="sec" onClick={close}>取消</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function StartProjectFlow({
  cost, project, job, slash, assignment, onAssign, onClearProject, onClearJob, hand, market, actions,
}: {
  cost: number;
  project?: ProjectCard;
  job?: JobCard;
  slash: boolean;
  assignment: string | null;
  onAssign: (name: string) => void;
  onClearProject: () => void;
  onClearJob: () => void;
  hand?: ReactNode;
  market?: ReactNode;
  actions: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    // On mobile the nonmodal section starts below the sticky header.
    heading.current?.focus();
  }, []);
  const clear = (callback: () => void) => {
    callback();
    heading.current?.focus({ preventScroll: true });
  };
  return (
    <section className="start-project" data-testid="start-project-flow" aria-labelledby="start-project-title">
      <h2 ref={heading} tabIndex={-1} id="start-project-title" data-testid="start-project-heading">
        發起專案 <span className="en-cap">START · COST {cost}</span>
      </h2>
      <div className="start-project__slots" data-testid="start-project-slots">
        <div className="start-project__slot" data-testid="start-project-project-slot">
          {project ? (
            <>
              <ProjectCardFace card={project} />
              <IconButton className="start-project__clear" label="取消選擇專案" data-testid="start-clear-project" onClick={() => clear(onClearProject)}>
                <CloseIcon />
              </IconButton>
            </>
          ) : <span>點選下方手牌</span>}
        </div>
        <div className="start-project__slot" data-testid="start-project-job-slot">
          {job ? (
            <>
              <JobTile id={job.id} name={job.name} preview />
              <IconButton className="start-project__clear" label="取消選擇人力" data-testid="start-clear-job" onClick={() => clear(onClearJob)}>
                <CloseIcon />
              </IconButton>
            </>
          ) : <span>點選下方人力卡</span>}
        </div>
      </div>
      {slash && project && job && (
        <SlashPicker key={JSON.stringify([project.id, job.id])} project={project} assignment={assignment} onAssign={onAssign} />
      )}
      {hand}
      {market}
      <div className="start-project__actions" data-testid="start-project-actions">{actions}</div>
    </section>
  );
}
