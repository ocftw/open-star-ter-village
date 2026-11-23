/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { GameContext } from '@/components/GameContextHelpers';
import TurnStrip from './TurnStrip';

const gameContext = { G: { playOrder: ['0', '1'], table: { eventSlot: null } }, ctx: { playOrderPos: 0, turn: 1 } } as GameContext;
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

// jsdom has no layout; the element scroller geometry is supplied through these properties.
function setGeometry(el: HTMLElement, g: { scrollHeight: number; clientHeight: number }) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => g.scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => g.clientHeight });
  return g;
}

beforeEach(() => {
  Object.defineProperties(window, {
    matchMedia: { configurable: true, value: jest.fn(() => ({ matches: false })) },
  });
  HTMLElement.prototype.scrollTo = jest.fn(function (this: HTMLElement, opts: ScrollToOptions) {
    this.scrollTop = opts.top as number;
  }) as unknown as typeof HTMLElement.prototype.scrollTo;
  global.ResizeObserver = jest.fn((callback) => {
    resize = callback;
    return { observe: jest.fn(), disconnect, unobserve: jest.fn() };
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return (this.tagName === 'HEADER' ? { height: 72 } : {}) as DOMRect;
  });
});

afterEach(() => { jest.restoreAllMocks(); disconnect.mockClear(); });

it('hides the button without overflow and sets the strip offset', () => {
  render(<Harness />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('turn-strip').style.getPropertyValue('--turn-strip-top')).toBe('88px');
  expect(screen.getByTestId('projects').style.getPropertyValue('--turn-strip-top')).toBe('88px');
  expect(screen.getByTestId('projects').style.getPropertyValue('--project-area-above')).toBe('0px');
});

it('appears on overflow, scrolls 80% of the box, flips at the end and returns to the top', () => {
  const { unmount } = render(<Harness />);
  const projects = screen.getByTestId('projects');
  const g = setGeometry(projects, { scrollHeight: 400, clientHeight: 400 });
  g.scrollHeight = 1000;
  act(() => resize([], {} as ResizeObserver));
  const down = screen.getByRole('button', { name: '專案區往下捲' });
  fireEvent.click(down);
  expect(projects.scrollTo).toHaveBeenLastCalledWith({ top: 320, behavior: 'smooth' });
  fireEvent.scroll(projects);
  fireEvent.click(down);
  expect(projects.scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'smooth' });
  fireEvent.scroll(projects);
  const up = screen.getByRole('button', { name: '專案區回到頂端' });
  expect(up.classList.contains('turn-project-scroll-up')).toBe(true);
  fireEvent.click(up);
  expect(projects.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  fireEvent.scroll(projects);
  expect(screen.getByRole('button', { name: '專案區往下捲' })).toBeTruthy();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it('tolerates 2px of rounding before showing the button', () => {
  render(<Harness />);
  const projects = screen.getByTestId('projects');
  const g = setGeometry(projects, { scrollHeight: 402, clientHeight: 400 });
  act(() => resize([], {} as ResizeObserver));
  expect(screen.queryByRole('button')).toBeNull();
  g.scrollHeight = 403;
  act(() => resize([], {} as ResizeObserver));
  expect(screen.getByRole('button')).toBeTruthy();
});

it('uses instant scroll under reduced motion', () => {
  jest.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
  render(<Harness />);
  const projects = screen.getByTestId('projects');
  setGeometry(projects, { scrollHeight: 1000, clientHeight: 400 });
  act(() => resize([], {} as ResizeObserver));
  fireEvent.click(screen.getByRole('button', { name: '專案區往下捲' }));
  expect(projects.scrollTo).toHaveBeenCalledWith({ top: 320, behavior: 'instant' });
});

it('keeps the scroll button out of the mobile strip', () => {
  render(<Harness horizontal />);
  setGeometry(screen.getByTestId('projects'), { scrollHeight: 1000, clientHeight: 400 });
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('turn-strip').classList.contains('turn-strip-horizontal')).toBe(true);
});
