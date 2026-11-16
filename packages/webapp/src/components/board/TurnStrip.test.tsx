/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { GameContext } from '@/components/GameContextHelpers';
import TurnStrip from './TurnStrip';

const gameContext = { G: { playOrder: ['0', '1'] }, ctx: { playOrderPos: 0, turn: 1 } } as GameContext;
let projectBottom: number;
let scrollY: number;
let resize: ResizeObserverCallback;
const disconnect = jest.fn();

function Harness({ horizontal = false }: { horizontal?: boolean }) {
  const projectsRef = React.useRef<HTMLDivElement>(null);
  return (
    <main data-game-board>
      <header data-testid="app-header" />
      <div ref={projectsRef} data-testid="projects" />
      <TurnStrip gameContext={gameContext} projectsRef={projectsRef} horizontal={horizontal} />
    </main>
  );
}

beforeEach(() => {
  projectBottom = 600;
  scrollY = 0;
  Object.defineProperties(window, {
    innerHeight: { configurable: true, value: 800 },
    scrollY: { configurable: true, get: () => scrollY },
    scrollTo: { configurable: true, value: jest.fn() },
    matchMedia: { configurable: true, value: jest.fn(() => ({ matches: false })) },
  });
  global.ResizeObserver = jest.fn((callback) => {
    resize = callback;
    return { observe: jest.fn(), disconnect, unobserve: jest.fn() };
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return (this.tagName === 'HEADER'
      ? { height: 72, top: 0, bottom: 72 }
      : { top: 88 - scrollY, bottom: projectBottom - scrollY }) as DOMRect;
  });
});

afterEach(() => { jest.restoreAllMocks(); disconnect.mockClear(); });

it('hides the button when only non-project page content extends beyond the viewport', () => {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1600 });
  render(<Harness />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('turn-strip').style.getPropertyValue('--turn-strip-top')).toBe('88px');
});

it('appears after project resize, scrolls 80%, then flips at the project end and returns to the top', () => {
  const { unmount } = render(<Harness />);
  projectBottom = 1800;
  // A new project can cause overflow without a window resize.
  act(() => resize([], {} as ResizeObserver));
  const down = screen.getByRole('button', { name: '專案區往下捲' });
  down.focus();
  expect(document.activeElement).toBe(down);
  fireEvent.click(down);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 640, behavior: 'smooth' });
  scrollY = 640;
  fireEvent.scroll(window);
  fireEvent.click(down);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1000, behavior: 'smooth' });
  scrollY = 1000;
  fireEvent.scroll(window);
  const up = screen.getByRole('button', { name: '專案區回到頂端' });
  expect(up.querySelector('svg')?.getAttribute('data-direction')).toBe('down');
  expect(up.classList.contains('turn-project-scroll-up')).toBe(true);
  fireEvent.click(up);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  scrollY = 0;
  fireEvent.scroll(window);
  expect(screen.getByRole('button', { name: '專案區往下捲' })).toBeTruthy();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it('uses instant page scroll under reduced motion', () => {
  projectBottom = 1800;
  jest.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: '專案區往下捲' }));
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 640, behavior: 'instant' });
});

it('keeps the page-scroll button out of the mobile strip', () => {
  projectBottom = 1800;
  render(<Harness horizontal />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('turn-strip').classList.contains('turn-strip-horizontal')).toBe(true);
});
