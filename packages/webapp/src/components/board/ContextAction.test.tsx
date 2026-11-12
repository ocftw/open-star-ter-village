/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GameContext } from '@/components/GameContextHelpers';
import GameStore, { GameState } from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { RuleMutator } from '@/game/store/slice/rule';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { ProjectCard } from '@/game/card';
import { makeStore } from '@/lib/store';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';
import ContextAction from './ContextAction';
import HandPanel from './HandPanel';
import JobMarket from './JobMarket';
import BoardProjectSlot from './BoardProjectSlot';
import MobileSheet from './MobileSheet';

const card: ProjectCard = {
  id: 'hand-project', name: '測試專案', type: '開放政府', difficulty: 1,
  description: '', requirements: { 工程師: 8, 美術設計: 4 },
};

function setup(change?: (G: GameState) => void, playerID: string | null = '0') {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1']);
  PlayersMutator.resetActionTokens(G.players, '0', 4);
  PlayersMutator.resetWorkerTokens(G.players, '0', 12);
  PlayersMutator.resetOvertimeTokens(G.players, '0', 1);
  PlayersMutator.addProjects(G.players, '0', [card]);
  ProjectBoardMutator.initialize(G.table.projectBoard, 8);
  JobSlotsMutator.addJobCards(G.table.jobSlots, [{ id: 'engineer', name: '工程師' }]);
  const slots = ['0', '1'].map((owner) => {
    const project = { ...card, id: `board-${owner}` };
    ProjectBoardMutator.add(G.table.projectBoard, project);
    const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, project);
    ProjectSlotMutator.assignOwner(slot, owner, 1);
    ProjectSlotMutator.assignWorker(slot, '工程師', '0', 1);
    return slot;
  });
  change?.(G);
  const moves = {
    createProject: jest.fn(), recruit: jest.fn(),
    contributeOwnedProjects: jest.fn(), contributeJoinedProjects: jest.fn(),
    removeAndRefillJobs: jest.fn(), endActionTurn: jest.fn(),
  };
  const gameContext = {
    G, ctx: { currentPlayer: '0', turn: 1, numMoves: 0 }, moves, playerID,
  } as unknown as GameContext;
  const store = makeStore();
  const view = render(
    <Provider store={store}>
      <ContextAction gameContext={gameContext} />
      {playerID === '0' && <>
        <HandPanel gameContext={gameContext} />
        <JobMarket gameContext={gameContext} idle discardActive={false} />
        {slots.map((slot) => <BoardProjectSlot key={slot.id} slot={slot} playerID="0" idle={false} />)}
      </>}
    </Provider>,
  );
  return { ...view, G, moves, store, slots };
}

const actionButton = (name: UserActionMoves) => screen.getByTestId(`action-${name}`) as HTMLButtonElement;
const confirmButton = () => screen.getByTestId('ca-confirm') as HTMLButtonElement;

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('shows the four actions, live AP, costs, contribution limits and normal-slot uses', () => {
  setup();
  expect(screen.getByTestId('ap-dots').getAttribute('data-ap')).toBe('4');
  expect(screen.getByTestId('ap-dots').children).toHaveLength(4);
  expect(within(actionButton(UserActionMoves.CreateProject)).getByLabelText('COST 2')).toBeTruthy();
  expect(within(actionButton(UserActionMoves.Recruit)).getByLabelText('COST 1')).toBeTruthy();
  expect(within(actionButton(UserActionMoves.ContributeOwnedProjects)).getByText('+4')).toBeTruthy();
  expect(within(actionButton(UserActionMoves.ContributeJoinedProjects)).getByText('+5')).toBeTruthy();
  expect(screen.getAllByLabelText('本回合剩餘 1 次')).toHaveLength(4);
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
});

it('reads changed AP costs and contribution limits from the active rules', () => {
  setup((G) => {
    G.rules.player.maxActionTokens = 6;
    G.rules.action.createProject.actionCost = 3;
    G.rules.action.contributeOwnedProjects.maxContributionValue = 7;
    G.rules.action.contributeJoinedProjects.maxContributionValue = 9;
    PlayersMutator.resetActionTokens(G.players, '0', 2);
  });
  expect(screen.getByLabelText('剩餘 2 AP').children).toHaveLength(6);
  expect(within(actionButton(UserActionMoves.CreateProject)).getByLabelText('COST 3')).toBeTruthy();
  expect(actionButton(UserActionMoves.CreateProject).disabled).toBe(true);
  expect(within(actionButton(UserActionMoves.ContributeOwnedProjects)).getByText('+7')).toBeTruthy();
  expect(within(actionButton(UserActionMoves.ContributeJoinedProjects)).getByText('+9')).toBeTruthy();
});

it.each([
  ['no AP', (G: GameState) => PlayersMutator.resetActionTokens(G.players, '0', 0)],
  ['used slot', (G: GameState) => ActionSlotMutator.occupy(G.table.actionSlots.createProject)],
  ['rule disabled', (G: GameState) => { G.rules.table.actionSlots.createProject.available = false; }],
  ['no workers', (G: GameState) => PlayersMutator.resetWorkerTokens(G.players, '0', 0)],
  ['no hand', (G: GameState) => { G.players['0'].hand.projects = []; }],
  ['no matching job', (G: GameState) => { G.table.jobSlots[0].name = '法務專家'; }],
  ['board full', (G: GameState) => {
    for (let i = 0; i < 6; i++) ProjectBoardMutator.add(G.table.projectBoard, { ...card, id: `full-${i}` });
  }],
] as const)('disables create when %s without starting an action', (_, change) => {
  setup(change);
  const button = actionButton(UserActionMoves.CreateProject);
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
});

it('shows spent and unavailable normal action slots as zero remaining uses', () => {
  setup((G) => {
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    G.rules.table.actionSlots.recruit.available = false;
  });
  expect(within(actionButton(UserActionMoves.CreateProject)).getByLabelText('本回合剩餘 0 次')).toBeTruthy();
  expect(within(actionButton(UserActionMoves.Recruit)).getByLabelText('本回合剩餘 0 次')).toBeTruthy();
});

it('keeps the event profession override available for mismatched job cards', () => {
  setup((G) => {
    G.table.jobSlots[0].name = '法務專家';
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
  });
  expect(actionButton(UserActionMoves.CreateProject).disabled).toBe(false);
  expect(actionButton(UserActionMoves.Recruit).disabled).toBe(false);
});

it('requires an owned/joined worker with an unfinished requirement for each contribution action', () => {
  setup((G) => {
    G.table.projectBoard.find((slot) => slot.owner === '0')!.contributions = [];
    G.table.projectBoard.find((slot) => slot.owner === '1')!.contributions[0].value = 8;
  });
  expect(actionButton(UserActionMoves.ContributeOwnedProjects).disabled).toBe(true);
  expect(actionButton(UserActionMoves.ContributeJoinedProjects).disabled).toBe(true);
  // Recruit is still legal: this player can join the unstaffed owned project.
  expect(actionButton(UserActionMoves.Recruit).disabled).toBe(false);
});

it('does not start an action from an idle hand, job, or board card click', () => {
  const { slots, moves } = setup();
  fireEvent.click(screen.getByTestId('hand-card-hand-project'));
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  fireEvent.click(screen.getByTestId(slots[0].id));
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
  expect(moves.createProject).not.toHaveBeenCalled();
});

it('selects the action first, then cards, and dispatches the existing create move', () => {
  const { moves } = setup();
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  // Re-selecting the active action must keep card selection interactive.
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  expect(confirmButton().disabled).toBe(true);
  fireEvent.click(screen.getByTestId('hand-card-hand-project'));
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  expect(confirmButton().disabled).toBe(false);
  fireEvent.click(confirmButton());
  expect(moves.createProject).toHaveBeenCalledWith('hand-project', 'engineer', undefined, undefined);
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
});

it('rejects duplicate workers during join preflight', () => {
  const { moves, slots } = setup((G) => {
    JobSlotsMutator.addJobCards(G.table.jobSlots, [{ id: 'designer', name: '美術設計' }]);
  });
  fireEvent.click(actionButton(UserActionMoves.Recruit));
  fireEvent.click(screen.getByTestId(slots[1].id));
  // The engineer position already has this player's worker; preflight rejects duplicates.
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  expect(confirmButton().disabled).toBe(true);
  expect(screen.getByTestId('preflight-error')).toBeTruthy();
  expect(moves.recruit).not.toHaveBeenCalled();
});

it.each(['project-first', 'job-first'])('joins a project through the existing move (%s)', (order) => {
  const { moves, slots } = setup((G) => {
    G.table.projectBoard.find((slot) => slot.owner === '1')!.contributions = [];
  });
  fireEvent.click(actionButton(UserActionMoves.Recruit));
  const project = screen.getByTestId(slots[1].id);
  const job = screen.getByTestId('job-card-engineer');
  fireEvent.click(order === 'project-first' ? project : job);
  expect(confirmButton().disabled).toBe(true);
  fireEvent.click(order === 'project-first' ? job : project);
  fireEvent.click(confirmButton());
  expect(moves.recruit).toHaveBeenCalledWith('engineer', slots[1].id, undefined, undefined);
});

it.each([
  [UserActionMoves.ContributeOwnedProjects, 0, 'contributeOwnedProjects'],
  [UserActionMoves.ContributeJoinedProjects, 1, 'contributeJoinedProjects'],
] as const)('dispatches %s with the selected contributions', (action, slotIndex, move) => {
  const { moves, slots } = setup();
  fireEvent.click(actionButton(action));
  const project = screen.getByTestId(slots[slotIndex].id);
  fireEvent.click(within(project).getByRole('button', { name: '增加 工程師 貢獻' }));
  expect(confirmButton().disabled).toBe(false);
  fireEvent.click(confirmButton());
  expect(moves[move]).toHaveBeenCalledWith([
    { projectSlotId: slots[slotIndex].id, jobName: '工程師', value: 1 },
  ], undefined);
});

it('keeps refill as a separate market action with the existing move', () => {
  const { moves } = setup();
  fireEvent.click(screen.getByTestId('refill-jobs'));
  expect(confirmButton().disabled).toBe(true);
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  fireEvent.click(confirmButton());
  expect(moves.removeAndRefillJobs).toHaveBeenCalledWith(['engineer'], undefined);
});

it('rejects contribution selections above the current rule limit', () => {
  setup();
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  const increment = screen.getByRole('button', { name: '增加 工程師 貢獻' });
  for (let i = 0; i < 4; i++) fireEvent.click(increment);
  expect(confirmButton().disabled).toBe(false);
  fireEvent.click(increment);
  expect(confirmButton().disabled).toBe(true);
});

it('clears selections and interactivity when switching actions and cancelling', () => {
  setup();
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  fireEvent.click(screen.getByTestId('hand-card-hand-project'));
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  expect(screen.queryByText('已選專案 1/1', { exact: false })).toBeNull();
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  expect(confirmButton().disabled).toBe(true);
  fireEvent.click(screen.getByTestId('ca-cancel'));
  fireEvent.click(screen.getByTestId('hand-card-hand-project'));
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
});

it('preflights against state changes before allowing confirmation', () => {
  const { G, store, moves } = setup();
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  fireEvent.click(screen.getByTestId('hand-card-hand-project'));
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  expect(confirmButton().disabled).toBe(false);
  G.players['0'].token.actions = 0;
  // Model a server update followed by a selection change that rerenders the panel.
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  fireEvent.click(screen.getByTestId('job-card-engineer'));
  expect(confirmButton().disabled).toBe(true);
  expect(screen.getByTestId('preflight-error')).toBeTruthy();
  fireEvent.click(confirmButton());
  expect(moves.createProject).not.toHaveBeenCalled();
  expect(store.getState().actionSteps.currentAction).toBe(UserActionMoves.CreateProject);
});

it('keeps cancel and confirmed end-turn available even with no AP', () => {
  const { moves } = setup((G) => PlayersMutator.resetActionTokens(G.players, '0', 0));
  fireEvent.click(screen.getByTestId('end-turn'));
  expect(moves.endActionTurn).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId('ca-cancel'));
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
  fireEvent.click(screen.getByTestId('end-turn'));
  fireEvent.click(confirmButton());
  expect(moves.endActionTurn).toHaveBeenCalledTimes(1);
});

it('hides player actions from observers and waiting players', () => {
  const observer = setup(undefined, null);
  expect(screen.queryByTestId('context-action')).toBeNull();
  observer.unmount();
  setup(undefined, '1');
  expect(screen.queryByTestId('context-action')).toBeNull();
});

it('clears active selection flags when the panel leaves the board', () => {
  const { store, unmount } = setup();
  fireEvent.click(actionButton(UserActionMoves.CreateProject));
  unmount();
  expect(store.getState().actionSteps.currentAction).toBeNull();
  expect(store.getState().actionSteps.interactiveState.handProjectCards).toBe(false);
});

it('keeps mobile actions and the expandable hand accessible in a stack', () => {
  render(<MobileSheet action={<button>選擇行動</button>} hand={<button>手牌</button>} />);
  expect(screen.getByRole('button', { name: '選擇行動' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '手牌' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '展開手牌 · Show hand' }));
  expect(screen.getByRole('button', { name: '手牌' })).toBeTruthy();
  expect(screen.getByTestId('mobile-sheet-handle').getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: '收合手牌 · Hide hand' }));
  expect(screen.queryByRole('button', { name: '手牌' })).toBeNull();
});

it('lets a spent 1-AP action start so the overtime prompt can appear', () => {
  setup((G) => ActionSlotMutator.occupy(G.table.actionSlots.contributeOwnedProjects));
  const button = actionButton(UserActionMoves.ContributeOwnedProjects);
  expect(button.disabled).toBe(false);
  fireEvent.click(button);
  expect(screen.getByTestId('overtime-confirm')).toBeTruthy();
});

it('keeps a spent 1-AP action disabled when no overtime token remains', () => {
  setup((G) => {
    ActionSlotMutator.occupy(G.table.actionSlots.contributeOwnedProjects);
    PlayersMutator.resetOvertimeTokens(G.players, '0', 0);
  });
  expect(actionButton(UserActionMoves.ContributeOwnedProjects).disabled).toBe(true);
});
