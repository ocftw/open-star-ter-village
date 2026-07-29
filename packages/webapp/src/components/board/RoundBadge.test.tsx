/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import RoundBadge from './RoundBadge';
import { GameContext } from '@/components/GameContextHelpers';

const contextWith = (round: number | undefined, numNonEndGameEventCards = 5) =>
  ({
    G: {
      table: { round },
      rules: { numNonEndGameEventCards },
    },
  }) as unknown as GameContext;

describe('RoundBadge', () => {
  it('renders 第 X / Y 回合 from table round and rule-derived total', () => {
    const { getByTestId } = render(<RoundBadge gameContext={contextWith(2, 5)} />);
    const badge = getByTestId('round-badge');
    expect(badge.getAttribute('data-round')).toBe('2');
    // Total = non-end-game event cards + the end-game round.
    expect(badge.textContent).toContain('第 2');
    expect(badge.textContent).toContain('/ 6 回合');
  });

  it('hides before the first round and on fixtures without state', () => {
    expect(render(<RoundBadge gameContext={contextWith(0)} />).queryByTestId('round-badge')).toBeNull();
    expect(
      render(<RoundBadge gameContext={{ G: { table: {} } } as unknown as GameContext} />).queryByTestId('round-badge'),
    ).toBeNull();
  });
});
