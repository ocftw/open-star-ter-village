/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ProjectCatalogLink from './ProjectCatalogLink';
import { trackProjectCatalogInterest } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  trackProjectCatalogInterest: jest.fn(),
}));

describe('ProjectCatalogLink', () => {
  beforeEach(() => {
    jest.mocked(trackProjectCatalogInterest).mockClear();
  });

  it.each(['header', 'game_over'] as const)(
    'opens the catalog safely and records the %s placement',
    (placement) => {
      const { getByRole } = render(
        <ProjectCatalogLink placement={placement}>Explore</ProjectCatalogLink>,
      );
      const link = getByRole('link', { name: 'Explore' });

      expect(link.getAttribute('href')).toBe(
        'https://openstartervillage.ocf.tw/cards',
      );
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');

      fireEvent.click(link);
      expect(trackProjectCatalogInterest).toHaveBeenCalledWith(placement);
    },
  );
});
