/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';
import type { FilteredMetadata } from 'boardgame.io';
import { Provider } from 'react-redux';
import BoardProjectSlot from './BoardProjectSlot';
import { makeStore } from '@/lib/store';
import {
  setOwnedContributionInteractive,
  setProjectSlotsInteractive,
} from '@/lib/reducers/actionStepSlice';
import { toggleProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';
import { ProjectSlotState } from '@/game';

const slot: ProjectSlotState = {
  id: 'projectSlot-0',
  owner: '0',
  ownerToken: 1,
  lastContributor: '0',
  card: {
    id: 'project-test',
    name: '測試專案',
    type: '開放政府',
    difficulty: 2,
    description: '',
    requirements: { 工程師: 8, 設計師: 4, 行銷企劃: 4 },
  },
  contributions: [
    // Editable row: current player ('0') already has a worker on 工程師.
    { jobName: '工程師', worker: '0', value: 4 },
    // Non-editable rows: another player's worker, and no worker at all.
    { jobName: '設計師', worker: '1', value: 1 },
  ],
};

const renderSlot = () => {
  const store = makeStore();
  // Contribute-to-owned-projects mode: only the player's own rows get steppers.
  store.dispatch(setOwnedContributionInteractive());
  return render(
    <Provider store={store}>
      <BoardProjectSlot slot={slot} playerID="0" idle={false} />
    </Provider>,
  );
};

describe('BoardProjectSlot requirement rows', () => {
  it('reserves an identical fixed-width control column in every row', () => {
    const { getAllByTestId } = renderSlot();
    const controls = getAllByTestId('contribution-controls');
    expect(controls).toHaveLength(3);
    const widths = controls.map((el) => el.style.width);
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).not.toBe('');
  });

  it('renders steppers only in editable rows; other rows expose no controls', () => {
    const { getAllByTestId } = renderSlot();
    const controls = getAllByTestId('contribution-controls');
    const withButtons = controls.filter((el) => within(el).queryAllByRole('button').length > 0);
    expect(withButtons).toHaveLength(1);
    expect(within(withButtons[0]).getAllByRole('button')).toHaveLength(2);

    // Placeholder columns are hidden from the a11y tree and contain nothing.
    controls
      .filter((el) => el !== withButtons[0])
      .forEach((el) => {
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.childElementCount).toBe(0);
      });
  });
});

const visualSlot: ProjectSlotState = {
  id: 'project-slot-visual',
  owner: '0',
  ownerToken: 1,
  lastContributor: '1',
  card: {
    id: 'project-visual',
    name: '資料申請小幫手',
    type: '開放資料',
    difficulty: 3,
    description: '',
    requirements: { 工程師: 2, 美術設計: 4, 行銷公關: 3 },
  },
  contributions: [
    { jobName: '工程師', worker: '0', value: 2 },
    { jobName: '美術設計', worker: '1', value: 3 },
    { jobName: '行銷公關', worker: '0', value: 1 },
  ],
};

const matchData: FilteredMetadata = [
  { id: 0, name: 'Claire' },
  { id: 1, name: 'Eva' },
];

function renderVisualSlot(
  props: Partial<React.ComponentProps<typeof BoardProjectSlot>> = {},
  store = makeStore(),
  width = 1280,
) {
  return render(
    <Provider store={store}>
      <div style={{ width }}>
        <BoardProjectSlot
          slot={visualSlot}
          playerID="0"
          matchData={matchData}
          idle={false}
          {...props}
        />
      </div>
    </Provider>,
  );
}

describe('BoardProjectSlot card content', () => {
  it.each(['0', '1', '2', '3'])('uses scoped seat styling for seat %s initials', (seat) => {
    const { getByTestId, getByLabelText, getByText } = renderVisualSlot({
      slot: {
        ...visualSlot,
        owner: seat,
        contributions: [{ jobName: '工程師', worker: seat, value: 1 }],
      },
    });
    const card = getByTestId(visualSlot.id);
    const initials = card.querySelectorAll('.project-card__seat');
    expect(initials).toHaveLength(2);
    initials.forEach((initial) => expect(initial.getAttribute('data-seat')).toBe(seat));
    expect(getByLabelText(/貢獻 1/).querySelector('.project-card__seat')).toBe(initials[1]);
    if (seat === '0') {
      expect(getByText('YOUR PROJECT').classList.contains('project-card__own')).toBe(true);
    }
  });

  it.each([1, 2, 3])('shows a %i-star difficulty label', (difficulty) => {
    const { getByLabelText } = renderVisualSlot({
      slot: { ...visualSlot, card: { ...visualSlot.card!, difficulty } },
    });
    expect(getByLabelText(`難度 ${difficulty}`).textContent).toBe('★'.repeat(difficulty));
  });

  it('shows the initiator, title, type, ownership, progress fractions and contributor chips', () => {
    const { getByTestId, getByText, queryByText, getByLabelText, getByRole } = renderVisualSlot();
    expect(getByTestId(visualSlot.id).getAttribute('data-job-requirements')).toBe(
      JSON.stringify(visualSlot.card!.requirements),
    );
    expect(getByText('Claire')).toBeTruthy();
    expect(getByRole('heading', { name: '資料申請小幫手' })).toBeTruthy();
    expect(getByLabelText('難度 3').textContent).toBe('★★★');
    expect(queryByText('開放資料')).toBeNull();
    expect(getByText('YOUR PROJECT')).toBeTruthy();
    ['2/2', '3/4', '1/3'].forEach((fraction) => expect(getByText(fraction)).toBeTruthy());
    expect(getByText('貢獻者 CONTRIBUTORS')).toBeTruthy();
    expect(getByLabelText('Claire 貢獻 3').textContent).toBe('C3');
    expect(getByLabelText('Eva 貢獻 3').textContent).toBe('E3');
  });

  it('only marks the current player’s own project', () => {
    const { queryByText } = renderVisualSlot({ playerID: '1' });
    expect(queryByText('YOUR PROJECT')).toBeNull();
  });

  it('does not render an empty slot as a card', () => {
    const { queryByTestId } = renderVisualSlot({ slot: { ...visualSlot, card: undefined } });
    expect(queryByTestId(visualSlot.id)).toBeNull();
  });
});

describe('BoardProjectSlot disabled state', () => {
  it('dims the card and removes its select control', () => {
    const { getByTestId, queryByRole } = renderVisualSlot({ visualState: 'disabled', idle: true, onIdleTap: jest.fn() });
    const card = getByTestId(visualSlot.id);
    expect(card.getAttribute('data-visual-state')).toBe('disabled');
    expect(card.classList.contains('project-card--disabled')).toBe(true);
    expect(queryByRole('button', { name: /查看專案|選擇專案/ })).toBeNull();
  });
});

describe.each([1280, 390])('BoardProjectSlot visual states at %ipx', (width) => {
  it.each(['default', 'focused', 'generalHint', 'jobHint'] as const)(
    'renders %s with its own visual treatment and preserves slot/row selectors',
    (visualState) => {
      const { getByTestId, container } = renderVisualSlot(
        { visualState, hintJobName: '美術設計' },
        makeStore(),
        width,
      );
      const card = getByTestId(visualSlot.id);
      expect(card.getAttribute('data-visual-state')).toBe(visualState);
      const stateClasses = Array.from(card.classList).filter((name) =>
        ['default', 'focused', 'generalHint', 'jobHint'].some((state) => name === `project-card--${state}`),
      );
      expect(stateClasses).toEqual([`project-card--${visualState}`]);
      expect(container.querySelector('[data-testid^="project-slot-"]')).toBe(card);
      expect(within(card).getAllByTestId('contribution-controls')).toHaveLength(3);
      // JSDOM has no layout: exercise the responsive hook; shots.mjs checks real overflow.
      expect(card.classList.contains('project-card--compact')).toBe(true);
      expect(card.parentElement!.style.width).toBe(`${width}px`);
      expect(within(card).getByLabelText('難度 3').textContent).toBe('★★★');
      expect(within(card).getByText('3/4')).toBeTruthy();
      expect(within(card).getByLabelText('Eva 貢獻 3')).toBeTruthy();
      const hintedRows = card.querySelectorAll('.project-card__progress-row--hinted');
      expect(hintedRows).toHaveLength(visualState === 'jobHint' ? 1 : 0);
      if (visualState === 'jobHint') {
        expect(within(hintedRows[0] as HTMLElement).getByAltText('美術設計')).toBeTruthy();
        expect(hintedRows[0].getAttribute('data-job-hint')).toBe('true');
      }
    },
  );
});

describe('BoardProjectSlot interactions', () => {
  it.each(['Enter', ' '])('selects from a focusable native card button with %p', (key) => {
    const store = makeStore();
    store.dispatch(setProjectSlotsInteractive());
    store.dispatch(toggleProjectSlotSelection('project-slot-other'));
    const onIdleTap = jest.fn();
    const { getByTestId, getByRole } = renderVisualSlot({ idle: true, onIdleTap }, store);
    const card = getByTestId(visualSlot.id);
    const control = getByRole('button', { name: '選擇專案 資料申請小幫手（Claire）' });
    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('type')).toBe('button');
    expect(control.tabIndex).toBe(0);
    expect(control.classList.contains('project-card__control')).toBe(true);
    expect(control.getAttribute('aria-pressed')).toBe('false');
    control.focus();
    expect(document.activeElement).toBe(control);
    // JSDOM does not synthesize native keyboard clicks or paint :focus-visible.
    fireEvent.keyDown(control, { key });
    fireEvent.keyUp(control, { key });
    fireEvent.click(control);
    expect(card.getAttribute('data-visual-state')).toBe('focused');
    expect(control.getAttribute('aria-pressed')).toBe('true');
    expect(store.getState().projectSlots.selectedSlots).toEqual({ [visualSlot.id]: true });
    expect(onIdleTap).not.toHaveBeenCalled();
    fireEvent.click(control);
    expect(card.getAttribute('data-visual-state')).toBe('default');
    expect(control.getAttribute('aria-pressed')).toBe('false');
  });

  it('allows an explicit visual state to override selection without changing selection behavior', () => {
    const store = makeStore();
    store.dispatch(setProjectSlotsInteractive());
    store.dispatch(toggleProjectSlotSelection(visualSlot.id));
    const { getByTestId, getByRole } = renderVisualSlot({ visualState: 'generalHint' }, store);
    const card = getByTestId(visualSlot.id);
    expect(card.getAttribute('data-visual-state')).toBe('generalHint');
    fireEvent.click(getByRole('button', { name: '選擇專案 資料申請小幫手（Claire）' }));
    expect(store.getState().projectSlots.selectedSlots).toEqual({});
    expect(card.getAttribute('data-visual-state')).toBe('generalHint');
  });

  it.each(['Enter', ' '])('keeps idle tap inference through the native button with %p', (key) => {
    const onIdleTap = jest.fn();
    const { getByRole } = renderVisualSlot({ idle: true, onIdleTap });
    const control = getByRole('button', { name: '查看專案 資料申請小幫手（Claire）' });
    expect(control.tagName).toBe('BUTTON');
    expect(control.tabIndex).toBe(0);
    expect(control.hasAttribute('aria-pressed')).toBe(false);
    expect(control.classList.contains('project-card__control')).toBe(true);
    control.focus();
    expect(document.activeElement).toBe(control);
    fireEvent.keyDown(control, { key });
    fireEvent.keyUp(control, { key });
    fireEvent.click(control);
    expect(onIdleTap).toHaveBeenCalledWith(visualSlot);
    expect(onIdleTap).toHaveBeenCalledTimes(1);
  });

  it.each([
    { idle: false },
    { idle: true },
    { idle: false, onIdleTap: jest.fn() },
  ])('exposes no card button when it is not clickable (%p)', (props) => {
    const { queryByRole, getByTestId } = renderVisualSlot(props);
    expect(queryByRole('button')).toBeNull();
    expect(getByTestId(visualSlot.id).tabIndex).toBe(-1);
  });

  it('keeps only the independent steppers in the tab order during contribution', () => {
    const { getAllByRole, queryByRole } = renderSlot();
    expect(queryByRole('button', { name: /專案/ })).toBeNull();
    expect(getAllByRole('button')).toHaveLength(2);
    const increment = getAllByRole('button')[1];
    expect(increment.tabIndex).toBe(0);
    increment.focus();
    expect(document.activeElement).toBe(increment);
  });

  it('keeps stepper updates in the fraction, committed-only chips, and click isolation', () => {
    const store = makeStore();
    store.dispatch(setOwnedContributionInteractive());
    const onIdleTap = jest.fn();
    const { getByRole, getByText, getByLabelText } = renderVisualSlot({ idle: true, onIdleTap }, store);
    expect((getByRole('button', { name: '增加 工程師 貢獻' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(getByRole('button', { name: '增加 行銷公關 貢獻' }));
    expect(getByText('2/3')).toBeTruthy();
    expect(getByLabelText('Claire 貢獻 3')).toBeTruthy();
    fireEvent.click(getByRole('button', { name: '減少 行銷公關 貢獻' }));
    expect(getByText('1/3')).toBeTruthy();
    expect(onIdleTap).not.toHaveBeenCalled();
    const cardControl = getByRole('button', { name: '查看專案 資料申請小幫手（Claire）' });
    const increment = getByRole('button', { name: '增加 行銷公關 貢獻' });
    expect(cardControl.contains(increment)).toBe(false);
    expect(increment.parentElement!.closest('button')).toBeNull();
    expect(increment.classList.contains('project-card__stepper')).toBe(true);
  });

  it('keeps profession targets independent of the named JobHint row', () => {
    const onPick = jest.fn();
    const onIdleTap = jest.fn();
    const { getByTestId, queryByTestId } = renderVisualSlot({
      idle: true,
      onIdleTap,
      visualState: 'jobHint',
      hintJobName: '美術設計',
      professionPicker: {
        eligibleJobNames: ['美術設計', '行銷公關'],
        selectedJobName: '行銷公關',
        onPick,
      },
    });
    const hintedRow = getByTestId('profession-target-美術設計');
    expect(hintedRow.classList.contains('project-card__progress-row--hinted')).toBe(true);
    expect(hintedRow.getAttribute('aria-pressed')).toBe('false');
    expect(hintedRow.closest('button')).toBeNull();
    expect(getByTestId('profession-target-行銷公關').getAttribute('aria-pressed')).toBe('true');
    expect(queryByTestId('profession-target-工程師')).toBeNull();
    fireEvent.click(hintedRow);
    expect(onPick).toHaveBeenCalledWith('美術設計');
    expect(onIdleTap).not.toHaveBeenCalled();
  });
});
