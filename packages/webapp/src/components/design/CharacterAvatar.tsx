/* eslint-disable @next/next/no-img-element */
import { JOB_META, JobRole } from './JobMeta';

type CharacterAvatarProps = {
  role: JobRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
};

export default function CharacterAvatar({ role, size = 'md', title }: CharacterAvatarProps) {
  const meta = JOB_META[role];
  const classes = ['job-char', role, size !== 'md' ? size : null].filter(Boolean).join(' ');
  return (
    <div className={classes} title={title ?? meta.zh}>
      <img src={meta.image} alt={meta.zh} draggable={false} />
    </div>
  );
}
