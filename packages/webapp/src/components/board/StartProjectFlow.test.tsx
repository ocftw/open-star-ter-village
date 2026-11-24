/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import type { GameContext } from '@/components/GameContextHelpers';
import type { ProjectCard } from '@/game/card';
import { SLASH_WILD_JOB_NAME } from '@/game/core/slashWildJob';
import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator } from '@/game/store/slice/projectBoard';
import { RuleMutator } from '@/game/store/slice/rule';
import { makeStore } from '@/lib/store';
import { getCurrentAction, UserActionMoves } from '@/lib/reducers/actionStepSlice';
import { useAppSelector } from '@/lib/hooks';
import ContextAction from './ContextAction';
import HandPanel from './HandPanel';
import JobMarket from './JobMarket';
import { StartProjectContext, useStartProject } from './useStartProject';

const project = (id: string, ...names: string[]): ProjectCard => ({
  id, name: id, type: '開放政府', difficulty: 1, description: '',
  requirements: Object.fromEntries(names.map((name) => [name, 2])),
});
const hand = [project('P1', '文字工作者'), project('P2', '工程師', '美術設計'), project('P3', '美術設計')];
const jobs = [
  { id: 'J1', name: '文字工作者' }, { id: 'J2', name: '工程師' },
  { id: 'J3', name: '法務專家' }, { id: 'J4', name: '美術設計' },
];

function makeGame(event: 'legacy' | 'wild' | false) {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['1', '0']);
  PlayersMutator.resetActionTokens(G.players, '0', 4);
  PlayersMutator.resetWorkerTokens(G.players, '0', 12);
  PlayersMutator.addProjects(G.players, '0', hand);
  PlayersMutator.addProjects(G.players, '1', [project('OTHER', '工程師')]);
  ProjectBoardMutator.initialize(G.table.projectBoard, 8);
  G.table.jobSlots = [...jobs];
  if (event) RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
  if (event === 'wild') {
    RuleMutator.enableSlashWildJobCard(G.rules);
    G.table.round = 1;
    G.table.jobSlots.unshift({ id: 'slash-0-1', name: SLASH_WILD_JOB_NAME });
  }
  return G;
}

function Table({ gameContext }: { gameContext: GameContext }) {
  const action = useAppSelector(getCurrentAction);
  const start = useStartProject(gameContext, action === UserActionMoves.CreateProject);
  return (
    <StartProjectContext.Provider value={start}>
      <ContextAction gameContext={gameContext} />
      <HandPanel gameContext={gameContext} />
      <JobMarket gameContext={gameContext} idle={action === null} discardActive={false} />
    </StartProjectContext.Provider>
  );
}

function setup(event: Parameters<typeof makeGame>[0] = false) {
  const store = makeStore();
  const createProject = jest.fn();
  const tree = (G: ReturnType<typeof makeGame>) => (
    <Provider store={store}>
      <Table gameContext={{ G, ctx: { currentPlayer: '0', playOrder: ['0', '1'], turn: 1, numMoves: 0 }, playerID: '0',
        moves: { createProject } } as unknown as GameContext} />
    </Provider>
  );
  const G = makeGame(event);
  const view = render(tree(G));
  tap('action-createProject');
  return { createProject, update: (state: ReturnType<typeof makeGame>) => view.rerender(tree(state)) };
}

const tap = (id: string) => fireEvent.click(screen.getByTestId(id));
const confirm = () => screen.getByTestId('ca-confirm') as HTMLButtonElement;
const ids = (prefix: 'job' | 'hand') => screen.getAllByTestId(new RegExp(`^${prefix}-card-`))
  .map((node) => node.getAttribute('data-testid')?.slice(`${prefix}-card-`.length));
const projectSlot = () => screen.getByTestId('start-project-project-slot');
const jobSlot = () => screen.getByTestId('start-project-job-slot');
const picker = () => within(screen.getByTestId('start-wild-picker'));
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('opens empty nonmodal slots and filters both rails, with removable selections', () => {
  setup();
  expect(document.activeElement).toBe(screen.getByTestId('start-project-heading'));
  expect(projectSlot().textContent).toBe('點選下方手牌');
  expect(jobSlot().textContent).toBe('點選下方人力卡');
  expect(confirm().disabled).toBe(true);
  expect(screen.queryByTestId('hand-card-OTHER')).toBeNull();

  tap('hand-card-P2');
  expect(ids('job')).toEqual(['J2', 'J4', 'J1', 'J3']);
  expect((screen.getByTestId('job-card-J1') as HTMLButtonElement).disabled).toBe(true);
  tap('job-card-J1');
  expect(jobSlot().textContent).toBe('點選下方人力卡');
  tap('job-card-J4');
  expect(projectSlot().textContent).toContain('P2');
  expect(jobSlot().textContent).toContain('美術設計');
  expect(confirm().disabled).toBe(false);
  tap('start-clear-project');
  expect(ids('hand')).toEqual(['P2', 'P3', 'P1']);
  expect(ids('job')).toEqual(['J1', 'J2', 'J3', 'J4']);
  expect(confirm().disabled).toBe(true);
  tap('hand-card-P1');
  fireEvent.keyDown(screen.getByTestId('hand-card-P1'), { key: 'Enter' });
  expect(projectSlot().textContent).toBe('點選下方手牌');
  tap('hand-card-P2');
  tap('job-card-J4');
  expect(ids('hand')).toEqual(['P1', 'P2', 'P3']);
  expect(ids('job')).toEqual(['J2', 'J4', 'J1', 'J3']);
  tap('start-clear-project');
  expect(ids('job')).toEqual(['J1', 'J2', 'J3', 'J4']);
});

it.each(['project', 'job'] as const)('opens the marked picker after both slots are filled (%s first)', (first) => {
  setup('wild');
  const pair = ['hand-card-P2', 'job-card-slash-0-1'];
  if (first === 'job') pair.reverse();
  tap(pair[0]);
  expect(screen.queryByTestId('start-wild-picker')).toBeNull();
  if (first === 'project') {
    expect(ids('job')).toEqual(['J2', 'J4', 'slash-0-1', 'J1', 'J3']);
    expect((screen.getByTestId('job-card-J3') as HTMLButtonElement).disabled).toBe(true);
    tap('job-card-J3');
    expect(jobSlot().textContent).toBe('點選下方人力卡');
    tap('job-card-J2');
    expect(confirm().disabled).toBe(false);
    expect(screen.queryByTestId('start-wild-picker')).toBeNull();
  }
  tap(pair[1]);
  expect(picker().getAllByRole('button').map((button) => button.textContent)).toEqual(['工程師', '美術設計', '取消']);
  expect(confirm().disabled).toBe(true);
  fireEvent.click(picker().getByRole('button', { name: '美術設計' }));
  expect(confirm().disabled).toBe(false);
  tap('hand-card-P3');
  expect(picker().getByRole('button', { name: '美術設計' }).getAttribute('aria-pressed')).toBe('false');
  expect(confirm().disabled).toBe(true);
});

it('legacy override clears the assignment on replacement and reopens a canceled picker without losing the pair', () => {
  const { createProject } = setup('legacy');
  tap('job-card-J3');
  expect(ids('hand')).toEqual(['P1', 'P2', 'P3']);
  tap('hand-card-P2');
  expect(picker().getAllByRole('button').map((button) => button.textContent)).toEqual(['工程師', '美術設計', '取消']);
  fireEvent.click(picker().getByRole('button', { name: /^取消$/ }));
  expect(screen.queryByTestId('start-wild-picker')).toBeNull();
  expect(projectSlot().textContent).toContain('P2');
  expect(jobSlot().textContent).toContain('法務專家');
  expect(confirm().disabled).toBe(true);
  expect(screen.queryByTestId('profession-target-工程師')).toBeNull();
  tap('start-assign');
  fireEvent.click(picker().getByRole('button', { name: '工程師' }));
  expect(confirm().disabled).toBe(false);
  tap('job-card-J1');
  expect(picker().getByRole('button', { name: '工程師' }).getAttribute('aria-pressed')).toBe('false');
  expect(confirm().disabled).toBe(true);
  fireEvent.click(picker().getByRole('button', { name: '美術設計' }));
  tap('ca-confirm');
  expect(createProject).toHaveBeenCalledTimes(1);
  expect(createProject).toHaveBeenCalledWith('P2', 'J1', '美術設計', undefined);
});

it.each(['project', 'job'] as const)('legacy override loses only the later pick on entitlement loss (%s first)', (first) => {
  const { update } = setup('legacy');
  const pair = ['hand-card-P2', 'job-card-J3'];
  if (first === 'job') pair.reverse();
  pair.forEach(tap);
  expect(screen.getByTestId('start-wild-picker')).toBeTruthy();
  update(makeGame(false));
  expect(screen.queryByTestId('start-wild-picker')).toBeNull();
  expect(!!screen.queryByTestId('start-clear-project')).toBe(first === 'project');
  expect(!!screen.queryByTestId('start-clear-job')).toBe(first === 'job');
  expect(confirm().disabled).toBe(true);
});

it('drops vanished IDs first and retains both extant picks on AP loss', () => {
  const { update, createProject } = setup();
  tap('hand-card-P2');
  tap('job-card-J2');
  const next = makeGame(false);
  PlayersMutator.resetActionTokens(next.players, '0', 0);
  update(next);
  expect(confirm().disabled).toBe(true);
  expect(screen.getByTestId('preflight-error').textContent).toContain('行動');
  expect(screen.getByTestId('start-clear-project')).toBeTruthy();
  expect(screen.getByTestId('start-clear-job')).toBeTruthy();
  tap('ca-confirm');
  expect(createProject).not.toHaveBeenCalled();
  const missing = makeGame(false);
  missing.table.jobSlots = missing.table.jobSlots.filter((job) => job.id !== 'J2');
  update(missing);
  expect(screen.queryByTestId('start-clear-job')).toBeNull();
  expect(screen.getByTestId('start-clear-project')).toBeTruthy();
});

it.each(['Cancel', 'Escape'])('%s restores both rails and focus to START', (method) => {
  setup();
  tap('hand-card-P2');
  tap('job-card-J4');
  if (method === 'Cancel') tap('ca-cancel');
  else fireEvent.keyDown(screen.getByTestId('job-card-J4'), { key: 'Escape' });
  expect(screen.queryByTestId('start-project-flow')).toBeNull();
  expect(ids('hand')).toEqual(['P1', 'P2', 'P3']);
  expect(ids('job')).toEqual(['J1', 'J2', 'J3', 'J4']);
  expect(document.activeElement).toBe(screen.getByTestId('action-createProject'));
});

it('reports a silent rejection without a second move', () => {
  const { createProject } = setup();
  tap('hand-card-P2');
  tap('job-card-J2');
  tap('ca-confirm');
  act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByTestId('action-error-toast')).toBeTruthy();
  expect(createProject).toHaveBeenCalledTimes(1);
});
