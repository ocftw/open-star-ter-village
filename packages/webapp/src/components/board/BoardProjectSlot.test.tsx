/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import BoardProjectSlot from './BoardProjectSlot';
import { makeStore } from '@/lib/store';
import { setOwnedContributionInteractive } from '@/lib/reducers/actionStepSlice';
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
