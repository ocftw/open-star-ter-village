/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MobileSheet from './MobileSheet';

it.each([false, true])('moves the one hand into the START host and restores expanded=%s', (expanded) => {
  const hand = <div data-testid="hand-panel" />;
  const action = <div data-testid="context-action" />;
  const { rerender } = render(<MobileSheet action={action} hand={hand} />);
  const handle = () => screen.getByTestId('mobile-sheet-handle');
  if (expanded) fireEvent.click(handle());
  expect(handle().getAttribute('aria-expanded')).toBe(String(expanded));

  rerender(<MobileSheet action={<section data-testid="start-project-flow">{hand}{action}</section>} hand={hand} startActive />);
  expect(screen.queryByTestId('mobile-sheet-handle')).toBeNull();
  expect(screen.getAllByTestId('hand-panel')).toHaveLength(1);
  expect(screen.getByTestId('start-project-flow').contains(screen.getByTestId('hand-panel'))).toBe(true);
  expect(screen.getByTestId('mobile-sheet').getAttribute('data-expanded')).toBe('true');

  rerender(<MobileSheet action={action} hand={hand} />);
  expect(handle().getAttribute('aria-expanded')).toBe(String(expanded));
  expect(screen.getByTestId('hand-panel').closest('[hidden]') !== null).toBe(!expanded);
});
