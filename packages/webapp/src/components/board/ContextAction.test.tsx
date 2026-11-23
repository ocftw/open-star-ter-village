/**
 * @jest-environment jsdom
 */
import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GameContext } from '@/components/GameContextHelpers';
import GameStore, { GameState } from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { ProjectCard } from '@/game/card';
import { makeStore } from '@/lib/store';
import { getCurrentAction, UserActionMoves } from '@/lib/reducers/actionStepSlice';
import { getContributions, updateContribute } from '@/lib/reducers/contributionSlice';
import { useAppSelector } from '@/lib/hooks';
import ContextAction from './ContextAction';
import HandPanel from './HandPanel';
import JobMarket from './JobMarket';
import { RefillFlowProvider } from './RefillFlow';
import BoardProjectSlot from './BoardProjectSlot';
import MobileSheet from './MobileSheet';
import { isContributionAction, useContributionFeedback } from './useContributionFeedback';

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
    G, ctx: { currentPlayer: '0', playOrder: ['0', '1'], turn: 1, numMoves: 0 }, moves, playerID, _stateID: 4, log: [],
  } as unknown as GameContext;
  const store = makeStore();
  const ui = (context: GameContext) => (
    <Provider store={store}><ActionBoard gameContext={context} /></Provider>
  );
  const view = render(ui(gameContext));
  return { ...view, G, moves, store, slots, gameContext, update: (context: GameContext) => view.rerender(ui(context)) };
}

function ActionBoard({ gameContext }: { gameContext: GameContext }) {
  const [mount, setMount] = React.useState<HTMLDivElement | null>(null);
  const { G, playerID } = gameContext;
  const action = useAppSelector(getCurrentAction);
  const { feedback, record } = useContributionFeedback(gameContext);
  return (
    <>
      <ContextAction gameContext={gameContext} contributionMount={mount} onContributionSubmit={record} />
      {playerID === '0' && <>
        <HandPanel gameContext={gameContext} />
        <JobMarket gameContext={gameContext} idle discardActive={false} />
        {G.table.projectBoard.filter((slot) => slot.card).map((slot) => (
          <BoardProjectSlot
            key={slot.id}
            slot={slot}
            playerID={playerID}
            idle={false}
            contributionMax={isContributionAction(action) ? RuleSelector.getMaxContributionValue(G.rules, action) : null}
            contributionFeedback={feedback}
          />
        ))}
      </>}
      <div ref={setMount} data-testid="test-contribution-host" />
    </>
  );
}

const actionButton = (name: UserActionMoves) => screen.getByTestId(`action-${name}`) as HTMLButtonElement;
const confirmButton = () => screen.getByTestId('ca-confirm') as HTMLButtonElement;
const projectSelect = (slotId: string) =>
  within(screen.getByTestId(slotId)).getByRole('button', { name: /選擇專案/ });

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
  expect(screen.getByRole('img', { name: '剩餘 2 AP' })).toBe(screen.getByLabelText('剩餘 2 AP'));
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

it('legacy (unmarked) game: keeps the event profession override available for mismatched job cards', () => {
  setup((G) => {
    G.table.jobSlots[0].name = '法務專家';
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
  });
  expect(actionButton(UserActionMoves.CreateProject).disabled).toBe(false);
  expect(actionButton(UserActionMoves.Recruit).disabled).toBe(false);
});

describe('斜槓青年 wild job card (marked game)', () => {
  const WILD = { id: 'slash-0-1', name: '斜槓青年' };
  const marked = (withWild: boolean) => (G: GameState) => {
    RuleMutator.enableSlashWildJobCard(G.rules);
    G.table.jobSlots[0].name = '法務專家'; // the only ordinary card is mismatched
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    if (withWild) G.table.jobSlots.unshift({ ...WILD });
  };

  it('an ordinary mismatched card gets no override even while entitled', () => {
    setup(marked(false));
    expect(actionButton(UserActionMoves.CreateProject).disabled).toBe(true);
    expect(actionButton(UserActionMoves.Recruit).disabled).toBe(true);
  });

  it('renders the wild tile and counts only real market cards', () => {
    setup(marked(true));
    expect(screen.getByTestId('job-card-slash-0-1').getAttribute('data-job-name')).toBe('斜槓青年');
    expect(screen.getByTestId('job-market-count').textContent).toBe('JOB MARKET · 1 CARDS');
    expect(actionButton(UserActionMoves.CreateProject).disabled).toBe(false);
  });

  it('offers the profession picker only for the wild tile and sends assignedJobName', () => {
    const { moves } = setup(marked(true));
    fireEvent.click(actionButton(UserActionMoves.CreateProject));
    fireEvent.click(screen.getByTestId('hand-card-hand-project'));
    fireEvent.click(screen.getByTestId('job-card-engineer')); // ordinary mismatched (法務專家)
    expect(screen.queryByTestId('profession-target-工程師')).toBeNull();

    fireEvent.click(screen.getByTestId('job-card-slash-0-1'));
    fireEvent.click(screen.getByTestId('profession-target-美術設計'));
    expect(confirmButton().disabled).toBe(false);
    fireEvent.click(confirmButton());
    expect(moves.createProject).toHaveBeenCalledWith('hand-project', 'slash-0-1', '美術設計', undefined);
  });
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
  expect(moves.createProject).toHaveBeenCalledTimes(1);
  expect(moves.createProject).toHaveBeenCalledWith('hand-project', 'engineer', undefined, undefined);
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
});

it('rejects duplicate workers during join preflight', () => {
  const { moves, slots } = setup((G) => {
    JobSlotsMutator.addJobCards(G.table.jobSlots, [{ id: 'designer', name: '美術設計' }]);
  });
  fireEvent.click(actionButton(UserActionMoves.Recruit));
  fireEvent.click(projectSelect(slots[1].id));
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
  const project = projectSelect(slots[1].id);
  const job = screen.getByTestId('job-card-engineer');
  fireEvent.click(order === 'project-first' ? project : job);
  expect(confirmButton().disabled).toBe(true);
  fireEvent.click(order === 'project-first' ? job : project);
  fireEvent.click(confirmButton());
  expect(moves.recruit).toHaveBeenCalledWith('engineer', slots[1].id, undefined, undefined);
});

it.each([
  [UserActionMoves.ContributeOwnedProjects, 0, 'contributeOwnedProjects', 7],
  [UserActionMoves.ContributeJoinedProjects, 1, 'contributeJoinedProjects', 9],
] as const)('dispatches %s once with the selected contributions and live limit', (action, slotIndex, move, max) => {
  const { moves, slots } = setup((G) => { G.rules.action[move].maxContributionValue = max; });
  fireEvent.click(actionButton(action));
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
  expect(screen.getByText(`在你有人力的職位旁按 ＋ 分配貢獻（本次 0/${max}）`)).toBeTruthy();
  const project = screen.getByTestId(slots[slotIndex].id);
  fireEvent.click(project);
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
  fireEvent.click(within(project).getByRole('button', { name: '增加 工程師 貢獻' }));
  const bar = within(screen.getByTestId('test-contribution-host')).getByTestId('contribution-confirm-bar');
  ['貢獻 +1', `最多 +${max}`, `剩餘 ${max - 1}`].forEach((text) => {
    expect(within(bar).getByText(text)).toBeTruthy();
  });
  expect(screen.getByText(`在你有人力的職位旁按 ＋ 分配貢獻（本次 1/${max}）`)).toBeTruthy();
  expect(confirmButton().disabled).toBe(false);
  const confirm = confirmButton();
  act(() => {
    fireEvent.click(confirm);
    fireEvent.click(confirm);
  });
  expect(moves[move]).toHaveBeenCalledTimes(1);
  expect(moves[move]).toHaveBeenCalledWith([
    { projectSlotId: slots[slotIndex].id, jobName: '工程師', value: 1 },
  ], undefined);
  expect(screen.queryByTestId('contribution-gain')).toBeNull();
});

it('keeps refill as a separate market action with the existing move', () => {
  const { moves } = setup();
  fireEvent.click(screen.getByTestId('refill-jobs'));
  expect(confirmButton().disabled).toBe(true);
  // #502: in refill/remove mode the × is the control, not the tile body.
  fireEvent.click(screen.getByTestId('job-remove-engineer'));
  fireEvent.click(confirmButton());
  expect(moves.removeAndRefillJobs).toHaveBeenCalledWith(['engineer'], undefined);
});

it('rejects contribution selections above the current rule limit', () => {
  const { gameContext, G, slots, moves, update } = setup();
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  const increment = screen.getByRole('button', { name: '增加 工程師 貢獻' });
  for (let i = 0; i < 4; i++) fireEvent.click(increment);
  expect(confirmButton().disabled).toBe(false);
  expect((increment as HTMLButtonElement).disabled).toBe(true);
  const rules = { ...G.rules, action: { ...G.rules.action, contributeOwnedProjects: {
    ...G.rules.action.contributeOwnedProjects, maxContributionValue: 3,
  } } };
  update({ ...gameContext, G: { ...G, rules } });
  expect(confirmButton().disabled).toBe(true);
  expect(screen.getByTestId('preflight-error')).toBeTruthy();
  fireEvent.click(confirmButton());
  expect(moves.contributeOwnedProjects).not.toHaveBeenCalled();
  expect(within(screen.getByTestId(slots[0].id)).getByRole('img', { name: /貢獻 1$/ })).toBeTruthy();
});

it('clears pending only from the bar and leaves the whole-action cancel available', () => {
  const { store, moves } = setup();
  const action = UserActionMoves.ContributeOwnedProjects;
  fireEvent.click(actionButton(action));
  const increment = screen.getByTestId('contribution-increment');
  fireEvent.click(increment);
  fireEvent.click(screen.getByTestId('contribution-cancel-pending'));
  expect(screen.queryByTestId('contribution-confirm-bar')).toBeNull();
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe(action);
  expect(screen.getByTestId('ap-dots').getAttribute('data-ap')).toBe('4');
  expect(getContributions(store.getState())).toEqual([]);
  expect(moves.contributeOwnedProjects).not.toHaveBeenCalled();
  fireEvent.click(increment);
  fireEvent.click(screen.getByTestId('ca-cancel'));
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe('idle');
  expect(screen.queryByTestId('contribution-confirm-bar')).toBeNull();
  expect(screen.queryByTestId('contribution-increment')).toBeNull();
  expect(getContributions(store.getState())).toEqual([]);
});

it('returns keyboard focus to the last stepper after cancelling pending contribution', () => {
  setup();
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  const increment = screen.getByRole('button', { name: '增加 工程師 貢獻' });
  increment.focus();
  fireEvent.click(increment);
  const cancel = screen.getByTestId('contribution-cancel-pending');
  cancel.focus();
  fireEvent.click(cancel);
  expect(screen.queryByTestId('contribution-confirm-bar')).toBeNull();
  expect(screen.getByTestId('context-action').getAttribute('data-mode')).toBe(UserActionMoves.ContributeOwnedProjects);
  expect(document.activeElement).toBe(increment);
});

it.each(['worker lost', 'row filled', 'card replaced'] as const)('blocks confirmation when the live board changes: %s', (change) => {
  const { G, gameContext, moves, slots, update } = setup();
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  fireEvent.click(screen.getByTestId('contribution-increment'));
  expect(confirmButton().disabled).toBe(false);
  const next = { ...slots[0], contributions: slots[0].contributions.map((row) => ({ ...row })) };
  if (change === 'worker lost') next.contributions = [];
  if (change === 'row filled') next.contributions[0].value = 8;
  if (change === 'card replaced') next.card = { ...next.card!, id: 'replacement' };
  const projectBoard = G.table.projectBoard.map((slot) => slot.id === next.id ? next : slot);
  update({ ...gameContext, G: { ...G, table: { ...G.table, projectBoard } } });
  expect(confirmButton().disabled).toBe(true);
  expect(screen.getByTestId('preflight-error')).toBeTruthy();
  fireEvent.click(confirmButton());
  expect(moves.contributeOwnedProjects).not.toHaveBeenCalled();
  expect(screen.queryByTestId('contribution-gain')).toBeNull();
});

it.each([true, false])('plays feedback only for the accepted contribution (accepted %s)', (accepted) => {
  const { G, slots, store, gameContext, moves, update } = setup();
  fireEvent.click(actionButton(UserActionMoves.ContributeOwnedProjects));
  // A decremented row remains in Redux with value zero and must stay out of the move.
  act(() => store.dispatch(updateContribute({ slotId: slots[1].id, jobName: '工程師', diffAmount: 0 })));
  fireEvent.click(screen.getByTestId('contribution-increment'));
  fireEvent.click(confirmButton());
  const pick = [{ projectSlotId: slots[0].id, jobName: '工程師', value: 1 }];
  expect(moves.contributeOwnedProjects).toHaveBeenCalledWith(pick, undefined);
  expect(screen.queryByTestId('contribution-gain')).toBeNull();
  if (accepted) {
    const updated = { ...slots[0], contributions: [{ ...slots[0].contributions[0], value: 2 }] };
    update({
      ...gameContext,
      _stateID: 5,
      ctx: { ...gameContext.ctx, numMoves: 1 },
      G: { ...G, table: { ...G.table, projectBoard: [updated, ...G.table.projectBoard.slice(1)] } },
      log: [{
        _stateID: 4, turn: 1, phase: '',
        action: { type: 'MAKE_MOVE', payload: { type: 'contributeOwnedProjects', args: [pick], playerID: '0' } },
      }],
    });
    expect(screen.getByTestId('contribution-gain').textContent).toBe('+1');
    expect(screen.getByText('2/8', { exact: false })).toBeTruthy();
    act(() => jest.advanceTimersByTime(700));
  } else {
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByTestId('action-error-toast')).toBeTruthy();
    expect(screen.getByTestId('ap-dots').getAttribute('data-ap')).toBe('4');
  }
  expect(screen.queryByTestId('contribution-gain')).toBeNull();
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

describe('換人力 refill flow (#496)', () => {
  const NAMES = ['工程師', '美術設計', '公務人員', '法務專家', '文字工作者'];
  const ids = (selector = '[data-testid^="job-card-"]') =>
    Array.from(document.querySelectorAll(selector)).map((el) => (el as HTMLElement).dataset.testid!.replace('job-card-', ''));
  const rowIds = () => Array.from(document.querySelectorAll('[data-testid="job-market-row"] > *')).map((el) => {
    const id = (el as HTMLElement).dataset.jobId;
    return id ?? 'EMPTY';
  });
  const advance = (ms: number) => React.act(() => { jest.advanceTimersByTime(ms); });

  function refillSetup({ reduced = false, turn = 1 }: { reduced?: boolean; turn?: number } = {}) {
    window.matchMedia = jest.fn(() => ({ matches: reduced })) as unknown as typeof window.matchMedia;
    const G = GameStore.initialState();
    PlayersMutator.initialize(G.players, ['0', '1']);
    PlayersMutator.resetActionTokens(G.players, '0', 4);
    ProjectBoardMutator.initialize(G.table.projectBoard, 8);
    JobSlotsMutator.addJobCards(G.table.jobSlots, ['A', 'B', 'C', 'D', 'E'].map((id, i) => ({ id, name: NAMES[i] })));
    const moves = {
      createProject: jest.fn(), recruit: jest.fn(), contributeOwnedProjects: jest.fn(),
      contributeJoinedProjects: jest.fn(), removeAndRefillJobs: jest.fn(), endActionTurn: jest.fn(),
    };
    const store = makeStore();
    const tree = (g: GameState, t = turn, numMoves = g.table.actionSlots.removeAndRefillJobs.isOccupied ? 1 : 0) => {
      const gameContext = { G: g, ctx: { currentPlayer: '0', playOrder: ['0', '1'], turn: t, numMoves }, moves, playerID: '0' } as unknown as GameContext;
      return (
        <Provider store={store}>
          <RefillFlowProvider gameContext={gameContext}>
            <ContextAction gameContext={gameContext} />
            <JobMarket gameContext={gameContext} idle={store.getState().actionSteps.currentAction === null} discardActive={false} />
          </RefillFlowProvider>
        </Provider>
      );
    };
    const view = render(tree(G));
    const accepted = (removed: string[], incoming: string[]) => {
      const next = JSON.parse(JSON.stringify(G)) as GameState;
      next.table.jobSlots = next.table.jobSlots.filter((c) => !removed.includes(c.id));
      JobSlotsMutator.addJobCards(next.table.jobSlots, incoming.map((id) => ({ id, name: '工程師' })));
      PlayersMutator.resetActionTokens(next.players, '0', 3);
      ActionSlotMutator.occupy(next.table.actionSlots.removeAndRefillJobs);
      return next;
    };
    const start = () => fireEvent.click(screen.getByTestId('refill-jobs'));
    const remove = (id: string) => fireEvent.click(screen.getByTestId(`job-remove-${id}`));
    return { G, moves, store, tree, view, accepted, start, remove };
  }
  const incomingAbsent = () => {
    expect(screen.queryByTestId('job-card-n1')).toBeNull();
    expect(screen.queryByTestId('job-card-n2')).toBeNull();
    expect(document.querySelector('[data-motion]')).toBeNull();
  };

  it('puts 取消 / 確認人力 in the market header: one ca-confirm, REFILL inactive, DONE off at zero', () => {
    const { start } = refillSetup();
    start();
    const actions = screen.getByTestId('job-market-actions');
    expect(screen.getAllByTestId('ca-confirm')).toHaveLength(1);
    expect(actions.contains(screen.getByTestId('ca-confirm'))).toBe(true);
    expect(actions.contains(screen.getByTestId('refill-cancel'))).toBe(true);
    expect((screen.getByTestId('refill-jobs') as HTMLButtonElement).disabled).toBe(true);
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByTestId('ca-cancel')).toBeTruthy();
    expect(screen.getAllByText(/點人力卡右上角的 ×/).length).toBeGreaterThan(0);
  });

  it('shrinks the old card inertly, then shows a ghost; count stays; no incoming face ever mounts', () => {
    const { start, remove } = refillSetup();
    start();
    remove('B');
    expect(screen.queryByTestId('job-remove-B')).toBeNull();
    expect(screen.getByTestId('job-card-B').getAttribute('data-shrinking')).toBe('true');
    expect(screen.getByTestId('job-market-count').textContent).toBe('JOB MARKET · 5 CARDS');
    advance(260);
    const ghost = screen.getByTestId('job-card-B');
    expect(ghost.getAttribute('data-visual-state')).toBe('ghost');
    expect(ghost.getAttribute('aria-label')).toBe('美術設計（已移除）');
    expect(screen.getByTestId('job-market-count').textContent).toBe('JOB MARKET · 5 CARDS');
    expect(confirmButton().disabled).toBe(false);
    incomingAbsent();
    ['A', 'C', 'D', 'E'].forEach((id) => remove(id));
    advance(260);
    expect(document.querySelectorAll('[data-visual-state="ghost"]')).toHaveLength(5);
    expect(document.querySelector('.job-remove')).toBeNull();
    incomingAbsent();
  });

  it('moves keyboard focus to the next live × and then to CANCEL', () => {
    const { start } = refillSetup();
    start();
    const first = screen.getByTestId('job-remove-D');
    first.focus();
    fireEvent.click(first);
    expect(document.activeElement).toBe(screen.getByTestId('job-remove-E'));
    fireEvent.click(screen.getByTestId('job-remove-E'));
    expect(document.activeElement).toBe(screen.getByTestId('refill-cancel'));
  });

  it.each(['refill-cancel', 'ca-cancel'])('%s restores the originals: no move, AP, reveal or timers left', (testid) => {
    const { start, remove, moves, store, G } = refillSetup();
    start();
    remove('B');
    remove('C');
    fireEvent.click(screen.getByTestId(testid));
    expect(store.getState().actionSteps.currentAction).toBeNull();
    expect(Object.keys(store.getState().jobSlots.selectedSlots)).toHaveLength(0);
    expect(moves.removeAndRefillJobs).not.toHaveBeenCalled();
    expect(ids()).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(document.querySelectorAll('[data-visual-state="ghost"], [data-shrinking]')).toHaveLength(0);
    expect(screen.getByTestId('ap-dots').getAttribute('data-ap')).toBe(String(4));
    expect(G.table.jobSlots).toHaveLength(5);
    incomingAbsent();
    advance(5000);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('dispatches once on DONE, keeps ghosts, and does not treat rejected/unrelated G as success', () => {
    const { start, remove, moves, view, tree, G } = refillSetup();
    start();
    remove('B');
    remove('C');
    advance(260);
    fireEvent.click(confirmButton());
    expect(moves.removeAndRefillJobs).toHaveBeenCalledTimes(1);
    expect(moves.removeAndRefillJobs).toHaveBeenCalledWith(['B', 'C'], undefined);
    expect(document.querySelectorAll('[data-visual-state="ghost"]')).toHaveLength(2);
    // numMoves moved but nothing else did: still not accepted.
    view.rerender(tree(G, 1, 1));
    expect(document.querySelectorAll('[data-visual-state="ghost"]')).toHaveLength(2);
    // The cards left but no AP was paid / slot not occupied: unrelated G.
    const unrelated = JSON.parse(JSON.stringify(G)) as GameState;
    unrelated.table.jobSlots = unrelated.table.jobSlots.filter((c) => !['B', 'C'].includes(c.id));
    JobSlotsMutator.addJobCards(unrelated.table.jobSlots, [{ id: 'n1', name: '工程師' }, { id: 'n2', name: '工程師' }]);
    view.rerender(tree(unrelated));
    incomingAbsent();
    expect(rowIds()).toEqual(['A', 'B', 'C', 'D', 'E']);
    advance(2500);
    // Gave up waiting: G is simply shown, no toast, no success.
    expect(screen.queryByText('已更換成新人力')).toBeNull();
    expect(screen.queryByTestId('score-popup')).toBeNull();
    expect(screen.queryByTestId('refill-cancel')).toBeNull();
  });

  it('after acceptance: empty slots, survivors slide left, then new cards deal one at a time at the right end', () => {
    const { start, remove, moves, view, tree, accepted } = refillSetup();
    start();
    remove('B');
    remove('C');
    advance(260);
    fireEvent.click(confirmButton());
    expect(moves.removeAndRefillJobs).toHaveBeenCalledTimes(1);
    expect(confirmButton).toThrow(); // controls left the header with the action
    incomingAbsent();
    view.rerender(tree(accepted(['B', 'C'], ['n1', 'n2'])));
    // Ghosts clear to empty slots without a face flash; incoming stay hidden.
    expect(rowIds()).toEqual(['A', 'EMPTY', 'EMPTY', 'D', 'E']);
    expect(screen.queryByTestId('job-card-B')).toBeNull();
    incomingAbsent();
    expect(screen.getByTestId('score-popup').textContent).toBe('影響力+1');
    expect(screen.queryByText('已更換成新人力')).toBeNull();
    // Survivors close every gap, relative order kept, before any card is dealt.
    advance(240);
    expect(rowIds()).toEqual(['A', 'D', 'E', 'EMPTY', 'EMPTY']);
    incomingAbsent();
    // First new card flies in right after the last card on the table.
    advance(300);
    expect(rowIds()).toEqual(['A', 'D', 'E', 'n1', 'EMPTY']);
    expect(screen.getByTestId('job-card-n1').getAttribute('data-motion')).toBe('deal');
    expect(screen.queryByTestId('job-card-n2')).toBeNull();
    // It lands before the next one flies; survivors never move.
    advance(520);
    expect(rowIds()).toEqual(['A', 'D', 'E', 'n1', 'n2']);
    expect(screen.getByTestId('job-card-n1').getAttribute('data-motion')).toBeNull();
    expect(screen.getByTestId('job-card-n2').getAttribute('data-motion')).toBe('deal');
    expect(screen.queryByText('已更換成新人力')).toBeNull();
    // The last landing opens the toast, separate from the score popup.
    advance(520);
    expect(rowIds()).toEqual(['A', 'D', 'E', 'n1', 'n2']);
    expect(screen.getByText('已更換成新人力')).toBeTruthy();
    expect(screen.getByTestId('score-popup').textContent).toBe('影響力+1');
    expect(screen.getByTestId('job-market-count').textContent).toBe('JOB MARKET · 5 CARDS');
    expect(document.querySelector('[data-motion]')).toBeNull();
    expect(document.querySelector('.push-in, [data-motion="push-in"]')).toBeNull();
    advance(2000);
    expect(screen.queryByText('已更換成新人力')).toBeNull();
    expect(screen.queryByTestId('score-popup')).toBeNull();
        expect(jest.getTimerCount()).toBe(0);
  });

  it('never enters a refill card with translateY(100%) or the pushUp keyframes', () => {
    const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
    const section = css.slice(css.indexOf('/* ===== issue 496: refill flow'), css.indexOf('/* ===== end issue 496'));
    expect(section).toContain("data-motion='deal'");
    expect(section.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/pushUp|push-in|translateY\(100%\)/);
  });

  it('reduced motion: acceptance-only in-place faces in the same final order, no flight or stagger', () => {
    const { start, remove, view, tree, accepted } = refillSetup({ reduced: true });
    start();
    remove('B');
    remove('C');
    advance(260);
    fireEvent.click(confirmButton());
    incomingAbsent();
    expect(rowIds()).toEqual(['A', 'B', 'C', 'D', 'E']);
    view.rerender(tree(accepted(['B', 'C'], ['n1', 'n2'])));
    expect(rowIds()).toEqual(['A', 'D', 'E', 'n1', 'n2']);
    expect(document.querySelector('[data-motion], [data-testid="job-slot-empty"]')).toBeNull();
    expect(screen.getByText('已更換成新人力')).toBeTruthy();
    expect(screen.getByTestId('score-popup').textContent).toBe('影響力+1');
  });

  it('drops the pending refill on a turn change and when another action is chosen', () => {
    const { start, remove, view, tree, G } = refillSetup();
    start();
    remove('B');
    advance(260);
    fireEvent.click(confirmButton());
    expect(document.querySelectorAll('[data-visual-state="ghost"]')).toHaveLength(1);
    view.rerender(tree(G, 2));
    expect(document.querySelectorAll('[data-visual-state="ghost"]')).toHaveLength(0);
    advance(2500); // the pre-existing silent-rejection watch is the only timer left
    expect(jest.getTimerCount()).toBe(0);
  });

  it('unmounting mid-deal leaves no timers behind', () => {
    const { start, remove, view, tree, accepted } = refillSetup();
    start();
    remove('B');
    advance(260);
    fireEvent.click(confirmButton());
    view.rerender(tree(accepted(['B'], ['n1'])));
    advance(300);
    view.unmount();
    jest.advanceTimersByTime(2500); // ContextAction's own silent-rejection watch
    expect(jest.getTimerCount()).toBe(0);
  });
});
