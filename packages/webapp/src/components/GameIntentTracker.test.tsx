/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import GameIntentTracker from './GameIntentTracker';
import { trackAnalyticsEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  trackAnalyticsEvent: jest.fn(),
}));

describe('GameIntentTracker', () => {
  beforeEach(() => {
    jest.mocked(trackAnalyticsEvent).mockClear();
  });

  it('records game intent once when the lobby page mounts', () => {
    const { rerender } = render(<GameIntentTracker />);

    expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(trackAnalyticsEvent).toHaveBeenCalledWith('game_intent', {
      entry_path: '/lobby',
    });

    rerender(<GameIntentTracker />);
    expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
  });
});
