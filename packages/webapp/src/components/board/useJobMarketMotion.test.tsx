/** @jest-environment jsdom */
import React from 'react';
import { act, render } from '@testing-library/react';
import { useJobMarketMotion } from './useJobMarketMotion';
import type { JobCard } from '@/game';

const job = (id: string) => ({ id, name: '工程師' }) as unknown as JobCard;
const noGhosts = new Set<string>();

function Probe({ jobs, ghosts = noGhosts }: { jobs: JobCard[]; ghosts?: Set<string> }) {
  const rows = useJobMarketMotion(jobs, ghosts);
  return (
    <ul>
      {rows.map((r) => (
        <li key={r.job.id} data-id={r.job.id} data-motion={r.motion ?? ''} data-delay={r.delay ?? ''} />
      ))}
    </ul>
  );
}
const read = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('li')).map((li) => `${li.dataset.id}:${li.dataset.motion}:${li.dataset.delay}`);

const setReduced = (reduced: boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: reduced }),
  });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useJobMarketMotion', () => {
  it('does not animate the first render', () => {
    setReduced(false);
    const { container } = render(<Probe jobs={[job('a'), job('b')]} />);
    expect(read(container)).toEqual(['a::', 'b::']);
  });

  it('drops leaving tiles first (40ms stagger), then pushes entering tiles up (60ms stagger)', () => {
    setReduced(false);
    const { container, rerender } = render(<Probe jobs={[job('a'), job('b'), job('c')]} />);
    rerender(<Probe jobs={[job('c'), job('x'), job('y')]} />);
    expect(read(container)).toEqual(['a:drop-out:0', 'b:drop-out:40', 'c::']);
    act(() => void jest.advanceTimersByTime(440));
    expect(read(container)).toEqual(['c::', 'x:push-in:0', 'y:push-in:60']);
    act(() => void jest.advanceTimersByTime(600));
    expect(read(container)).toEqual(['c::', 'x::', 'y::']);
  });

  it('removed ghosts leave silently; only the refills push up', () => {
    setReduced(false);
    const { container, rerender } = render(<Probe jobs={[job('a'), job('b')]} ghosts={new Set(['a'])} />);
    rerender(<Probe jobs={[job('b'), job('n')]} />);
    expect(read(container)).toEqual(['b::', 'n:push-in:0']);
  });

  it('prefers-reduced-motion: instant change, no motion rows at all', () => {
    setReduced(true);
    const { container, rerender } = render(<Probe jobs={[job('a'), job('b')]} />);
    rerender(<Probe jobs={[job('c'), job('d')]} />);
    expect(read(container)).toEqual(['c::', 'd::']);
  });
});
