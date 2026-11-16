/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EventCard } from '@/game';
import events from '@/game/data/card/events.json';
import RoundStartOverlay from './RoundStartOverlay';
import { useRoundStartOverlay } from './useRoundStartOverlay';

const event: EventCard = { ...events[0], id: 'round-event' };

function Prompt({ round = 1, gameOver = false }: { round?: number; gameOver?: boolean }) {
  const { open, close } = useRoundStartOverlay('fixed-match', round, gameOver, true);
  return <RoundStartOverlay round={round} event={event} open={open} onClose={close} />;
}

beforeEach(() => {
  sessionStorage.clear();
  global.ResizeObserver = jest.fn(() => ({ observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() }));
});

it('announces the Chinese round title together with the real event name and description', () => {
  const { rerender } = render(<Prompt round={2} />);
  expect(screen.getByRole('dialog', { name: `回合二 ${event.name}` })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('回合二');
  expect(screen.getByText(event.description)).toBeTruthy();
  rerender(<Prompt round={2} gameOver />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it.each(['知道了', 'mask', 'Escape'])('dismisses with %s and stays dismissed after remount', (path) => {
  const { unmount } = render(<React.StrictMode><Prompt /></React.StrictMode>);
  const dialog = screen.getByRole('dialog');
  jest.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    left: 100, right: 740, top: 200, bottom: 500,
  } as DOMRect);
  if (path === '知道了') fireEvent.click(screen.getByRole('button', { name: '知道了' }));
  if (path === 'mask') fireEvent.click(dialog, { clientX: 10, clientY: 10 });
  if (path === 'Escape') fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  unmount();
  render(<Prompt />);
  expect(screen.queryByRole('dialog')).toBeNull();
  jest.restoreAllMocks();
});

it('keeps the prompt open when its event card is clicked', () => {
  render(<Prompt />);
  fireEvent.click(screen.getByTestId('event-card-banner'));
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('centres the dialog on the masked board and releases the layout observer on close', () => {
  const bounds = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 16, right: 1000, top: 100, bottom: 700, width: 984, height: 600,
  } as DOMRect);
  try {
    render(<Prompt />);
    const surface = screen.getByTestId('round-start-overlay');
    expect(surface.style.getPropertyValue('--round-start-x')).toBe('508px');
    expect(surface.style.getPropertyValue('--round-start-y')).toBe('400px');
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    const observer = jest.mocked(ResizeObserver).mock.results[0].value;
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  } finally {
    bounds.mockRestore();
  }
});

it('disables title and mask animation for reduced motion and uses a 44px mobile title', () => {
  // jsdom does not apply media queries; inspect the shipped rules here and
  // verify computed styles with emulated reduced motion in mobile.spec.ts.
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  const story = css.split('/* ===== story 7:')[1];
  expect(story).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.round-start-overlay, \.round-start-title\s*\{\s*animation: none; transition: none;/);
  expect(story).toMatch(/@media \(max-width: 899px\)[\s\S]*?\.round-start-title\s*\{ font-size: 44px;/);
});
