/**
 * Design metadata for the 7 job roles and 3 project types.
 * Ported from the redesign mock (RFC: issue #399).
 *
 * Role keys are the short design-system identifiers used by CSS classes
 * (`job-char.eng`, `--job-eng` …); the game data (`src/game/data/card/*.json`)
 * identifies jobs and project types by their Chinese names, so lookups from
 * game values go through `getJobMetaByName` / `getProjectTypeMetaByName`.
 */

export type JobRole =
  | 'eng'
  | 'design'
  | 'civil'
  | 'legal'
  | 'writer'
  | 'issue'
  | 'marketing';

export type JobMeta = {
  role: JobRole;
  zh: string;
  en: string;
  hint: string;
  /** Path under `public/` to the official character cutout */
  image: string;
  /** CSS custom property holding the role's strong color */
  color: string;
  /** CSS custom property holding the role's soft (tint) color */
  softColor: string;
};

export const JOB_META: Record<JobRole, JobMeta> = {
  eng: {
    role: 'eng',
    zh: '工程師',
    en: 'Engineer',
    hint: 'Codes and ships.',
    image: '/characters/engineer.png',
    color: 'var(--job-eng)',
    softColor: 'var(--job-eng-soft)',
  },
  design: {
    role: 'design',
    zh: '美術設計',
    en: 'Designer',
    hint: 'Makes it beautiful.',
    image: '/characters/designer.png',
    color: 'var(--job-design)',
    softColor: 'var(--job-design-soft)',
  },
  civil: {
    role: 'civil',
    zh: '公務人員',
    en: 'Civil Servant',
    hint: 'Bridges to government.',
    image: '/characters/civil-servant.png',
    color: 'var(--job-civil)',
    softColor: 'var(--job-civil-soft)',
  },
  legal: {
    role: 'legal',
    zh: '法務專家',
    en: 'Legal',
    hint: 'Licensing & policy.',
    image: '/characters/legal.png',
    color: 'var(--job-legal)',
    softColor: 'var(--job-legal-soft)',
  },
  writer: {
    role: 'writer',
    zh: '文字工作者',
    en: 'Writer',
    hint: 'Docs and copy.',
    image: '/characters/writer.png',
    color: 'var(--job-writer)',
    softColor: 'var(--job-writer-soft)',
  },
  issue: {
    role: 'issue',
    zh: '議題工作者',
    en: 'Advocate',
    hint: 'Drives the cause.',
    image: '/characters/issue-worker.png',
    color: 'var(--job-issue)',
    softColor: 'var(--job-issue-soft)',
  },
  marketing: {
    role: 'marketing',
    zh: '行銷公關',
    en: 'Marketing',
    hint: 'Reaches the world.',
    image: '/characters/marketing.png',
    color: 'var(--job-marketing)',
    softColor: 'var(--job-marketing-soft)',
  },
};

const JOB_META_BY_NAME: Record<string, JobMeta> = Object.fromEntries(
  Object.values(JOB_META).map((meta) => [meta.zh, meta]),
);

/** Look up role meta from a game job name (e.g. "工程師" from jobs.json). */
export function getJobMetaByName(name: string): JobMeta | undefined {
  return JOB_META_BY_NAME[name];
}

export type ProjectTypeKey = 'oss' | 'gov' | 'data';

export type ProjectTypeMeta = {
  key: ProjectTypeKey;
  zh: string;
  en: string;
  /** CSS custom property holding the type's badge color */
  color: string;
  /** CSS custom property holding the type's readable ink color */
  ink: string;
};

export const PROJECT_TYPES: Record<ProjectTypeKey, ProjectTypeMeta> = {
  oss: {
    key: 'oss',
    zh: '開放原始碼',
    en: 'Open Source',
    color: 'var(--proj-oss)',
    ink: 'var(--proj-oss-ink)',
  },
  gov: {
    key: 'gov',
    zh: '開放政府',
    en: 'Open Government',
    color: 'var(--proj-gov)',
    ink: 'var(--proj-gov-ink)',
  },
  data: {
    key: 'data',
    zh: '開放資料',
    en: 'Open Data',
    color: 'var(--proj-data)',
    ink: 'var(--proj-data-ink)',
  },
};

const PROJECT_TYPE_BY_NAME: Record<string, ProjectTypeMeta> = Object.fromEntries(
  Object.values(PROJECT_TYPES).map((meta) => [meta.zh, meta]),
);

/** Look up type meta from a game project type (e.g. "開放原始碼" from projects.json). */
export function getProjectTypeMetaByName(name: string): ProjectTypeMeta | undefined {
  return PROJECT_TYPE_BY_NAME[name];
}

/** Player seat colors, indexed by seat (0-5), as CSS custom properties. */
export const PLAYER_COLORS = [
  'var(--p0)',
  'var(--p1)',
  'var(--p2)',
  'var(--p3)',
  'var(--p4)',
  'var(--p5)',
] as const;
