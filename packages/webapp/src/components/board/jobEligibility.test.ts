import { isJobEligible } from './jobEligibility';
import type { ProjectCard, ProjectSlotState } from '@/game';

const card = { requirements: { 工程師: 2, 美術設計: 1 } } as unknown as ProjectCard;
const slot = (contributions: ProjectSlotState['contributions']) =>
  ({ id: 's', owner: '1', card, contributions }) as unknown as ProjectSlotState;

describe('isJobEligible', () => {
  it('createProject: nothing selected means nothing is dimmed', () => {
    expect(isJobEligible('行銷公關', { action: 'createProject', override: false })).toBe(true);
  });

  it('createProject: only the selected project’s jobs stay usable', () => {
    const ctx = { action: 'createProject', card, override: false } as const;
    expect(isJobEligible('工程師', ctx)).toBe(true);
    expect(isJobEligible('行銷公關', ctx)).toBe(false);
  });

  it('createProject: 斜槓青年 override keeps every tile usable', () => {
    expect(isJobEligible('行銷公關', { action: 'createProject', card, override: true })).toBe(true);
  });

  it('recruit: fulfilled or already-held positions are dimmed', () => {
    const ctx = {
      action: 'recruit',
      playerID: '0',
      override: false,
      slot: slot([
        { jobName: '美術設計', worker: '1', value: 1 },
        { jobName: '工程師', worker: '0', value: 1 },
      ]),
    } as const;
    expect(isJobEligible('美術設計', ctx)).toBe(false); // requirement fulfilled
    expect(isJobEligible('工程師', ctx)).toBe(false); // already assigned by me
    expect(isJobEligible('行銷公關', ctx)).toBe(false); // not required
  });

  it('recruit: open position is usable; override opens mismatched jobs while a target exists', () => {
    const open = slot([]);
    expect(isJobEligible('工程師', { action: 'recruit', slot: open, playerID: '0', override: false })).toBe(true);
    expect(isJobEligible('行銷公關', { action: 'recruit', slot: open, playerID: '0', override: true })).toBe(true);
  });
});
