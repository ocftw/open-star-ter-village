/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import Boardgame from './BoardGame';
import StoreProvider from '@/app/StoreProvider';
import game, { ProjectCard } from '@/game';
import { setup } from '@/game/core/setup';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { makeStore } from '@/lib/store';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dev',
  useSearchParams: () => new URLSearchParams(),
}));

const getMatchMock = jest.fn();
jest.mock('@/app/lobby/actions', () => ({
  ...jest.requireActual('@/app/lobby/actions'),
  getMatch: (id: string) => getMatchMock(id),
}));

let mobileMediaQuery: MediaQueryList;
beforeEach(() => {
  mobileMediaQuery = Object.assign(new EventTarget(), {
    matches: false,
    media: '(max-width: 899px)',
    onchange: null,
    addListener() {},
    removeListener() {},
  }) as MediaQueryList;
  window.matchMedia = jest.fn(() => mobileMediaQuery);
});

const card: ProjectCard = {
  id: 'action-first-hand', name: '行動優先測試', type: '開放政府', difficulty: 1,
  description: '', requirements: { 工程師: 8 },
};
const actionFirstGame: typeof game = {
  ...game,
  setup: (context) => {
    const G = setup(context);
    G.playOrder = ['0', '1'];
    G.players['0'].hand.projects = [card];
    G.table.jobSlots = [{ id: 'action-first-job', name: '工程師' }];
    const project = { ...card, id: 'action-first-board' };
    ProjectBoardMutator.add(G.table.projectBoard, project);
    const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, project);
    ProjectSlotMutator.assignOwner(slot, '0', 1);
    ProjectSlotMutator.assignWorker(slot, '工程師', '0', 1);
    return G;
  },
  // Keep this UI regression fixture independent of the random first event.
  turn: { ...game.turn, onBegin: () => {} },
};

// Offline dev games run on Local(), where boardgame.io still reports isMultiplayer.
it('offers no observer 繼續觀戰 and polls no lobby in an offline game (#373)', async () => {
  const finishedGame = { ...game, endIf: () => ({ winners: ['0'] }) };
  render(
    <StoreProvider>
      <Boardgame isLocal matchID="dev-local" playerID={undefined} numPlayers={3} gameConfig={finishedGame} />
    </StoreProvider>,
  );
  await waitFor(() => expect(screen.getByText('遊戲結束', { selector: 'h2' })).toBeTruthy());
  expect(screen.queryByTestId('observer-watch')).toBeNull();
  expect(getMatchMock).not.toHaveBeenCalled();
});

it('starts actions from the panel rather than idle cards in the real board', async () => {
  render(
    <StoreProvider>
      <Boardgame isLocal matchID="action-first-board" playerID="0" numPlayers={2} gameConfig={actionFirstGame} />
    </StoreProvider>,
  );
  const panel = await screen.findByTestId('context-action');
  fireEvent.click(screen.getByTestId('hand-card-action-first-hand'));
  fireEvent.click(screen.getByTestId('job-card-action-first-job'));
  fireEvent.click(screen.getByTestId('project-slot-0'));
  expect(panel.getAttribute('data-mode')).toBe('idle');
  fireEvent.click(screen.getByTestId('action-createProject'));
  fireEvent.click(screen.getByTestId('hand-card-action-first-hand'));
  fireEvent.click(screen.getByTestId('job-card-action-first-job'));
  expect((screen.getByTestId('ca-confirm') as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(screen.getByTestId('ca-cancel'));
  expect(panel.getAttribute('data-mode')).toBe('idle');
});

it('clears action and interaction flags when the board swaps from desktop to mobile', async () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <Boardgame isLocal matchID="breakpoint-swap" playerID="0" numPlayers={2} gameConfig={actionFirstGame} />
    </Provider>,
  );
  const desktopPanel = await screen.findByTestId('context-action');
  expect(screen.queryByTestId('mobile-sheet')).toBeNull();
  fireEvent.click(within(desktopPanel).getByTestId('action-createProject'));
  expect(store.getState().actionSteps.currentAction).toBe(UserActionMoves.CreateProject);
  expect(store.getState().actionSteps.interactiveState.handProjectCards).toBe(true);
  expect(store.getState().actionSteps.interactiveState.jobSlots).toBe(true);

  act(() => {
    Object.assign(mobileMediaQuery, { matches: true });
    mobileMediaQuery.dispatchEvent(Object.assign(new Event('change'), {
      matches: true,
      media: mobileMediaQuery.media,
    }));
  });

  const mobileSheet = await screen.findByTestId('mobile-sheet');
  const mobilePanel = within(mobileSheet).getByTestId('context-action');
  expect(mobilePanel).not.toBe(desktopPanel);
  expect(mobilePanel.getAttribute('data-mode')).toBe('idle');
  expect(store.getState().actionSteps.currentAction).toBeNull();
  expect(store.getState().actionSteps.interactiveState).toEqual({
    handProjectCards: false,
    jobSlots: false,
    projectSlots: false,
    ownedContribution: false,
    joinedContribution: false,
  });
});
