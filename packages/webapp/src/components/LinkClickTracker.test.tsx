/**
 * @jest-environment jsdom
 */

import { fireEvent, render } from '@testing-library/react';
import LinkClickTracker from './LinkClickTracker';
import { trackLinkClick } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  trackLinkClick: jest.fn(),
}));

describe('LinkClickTracker', () => {
  beforeEach(() => jest.mocked(trackLinkClick).mockClear());

  it('tracks nested content inside every activated anchor', () => {
    const { getByText } = render(
      <>
        <LinkClickTracker />
        <a href="/lobby">
          <span>Play</span>
        </a>
      </>,
    );

    fireEvent.click(getByText('Play'));

    expect(trackLinkClick).toHaveBeenCalledTimes(1);
    expect(trackLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/lobby' }),
    );
  });

  it('ignores context-menu clicks', () => {
    const { getByText } = render(
      <>
        <LinkClickTracker />
        <a href="/lobby">Play</a>
      </>,
    );

    fireEvent(
      getByText('Play'),
      new MouseEvent('auxclick', { bubbles: true, button: 2 }),
    );

    expect(trackLinkClick).not.toHaveBeenCalled();
  });
});
