/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { EventCard } from '@/game';
import events from '@/game/data/card/events.json';
import EventButton from './EventButton';
import EventCardDialog from './EventCardDialog';

const event: EventCard = { ...events.find((card) => card.name === '四大自由')!, id: 'event-1' };

function openEvent() {
  const button = screen.getByRole('button', { name: /事件.*EVENT/ });
  button.focus();
  fireEvent.click(button);
  return button;
}

it('keeps the card hidden until opened and shows the event tag, art, name and description', () => {
  render(<EventButton event={event} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  const button = openEvent();
  expect(button.getAttribute('aria-expanded')).toBe('true');
  const dialog = screen.getByRole('dialog', { name: event.name });
  expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText(event.description).id);
  expect(screen.getByTestId('event-card-banner').textContent).toContain('事件 EVENT');
  expect(screen.getByText('✦').getAttribute('aria-hidden')).toBe('true');
});

it.each(['知道了', 'Escape', 'overlay'])('closes via %s and returns focus in StrictMode', (method) => {
  render(<React.StrictMode><EventButton event={event} /></React.StrictMode>);
  const button = openEvent();
  const dialog = screen.getByRole('dialog');
  // jsdom has no layout; give the native shell a real panel boundary so a
  // backdrop click can be distinguished from its padding.
  jest.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    left: 100, right: 740, top: 200, bottom: 400,
  } as DOMRect);
  if (method === '知道了') fireEvent.click(screen.getByRole('button', { name: method }));
  if (method === 'Escape') {
    // Browsers dispatch cancel when Escape is pressed in a modal dialog.
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
  }
  if (method === 'overlay') fireEvent.click(dialog, { clientX: 10, clientY: 10 });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(button);
  jest.restoreAllMocks();
});

it('keeps the dialog open when its card or panel padding is clicked', () => {
  render(<EventButton event={event} />);
  openEvent();
  fireEvent.click(screen.getByTestId('event-card-banner'));
  fireEvent.click(screen.getByRole('dialog'));
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('exports a controlled dialog with hourglass art for the last round', () => {
  const lastRound = { ...events.find((card) => card.type === 'last_round')!, id: 'last-round' };
  const onClose = jest.fn();
  const { rerender } = render(<EventCardDialog event={lastRound} open onClose={onClose} />);
  expect(screen.getByRole('dialog', { name: lastRound.name })).toBeTruthy();
  expect(screen.getByText(lastRound.description)).toBeTruthy();
  expect(screen.getByText('⏳')).toBeTruthy();
  expect(screen.queryByText('✦')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '知道了' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  rerender(<EventCardDialog event={lastRound} open={false} onClose={onClose} />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('hides without an event and never auto-opens when the event changes or returns', () => {
  const { rerender } = render(<EventButton event={null} />);
  expect(screen.queryByTestId('event-button')).toBeNull();
  rerender(<EventButton event={event} />);
  openEvent();
  rerender(<EventButton event={{ ...event, id: 'event-2' }} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  openEvent();
  rerender(<EventButton event={null} />);
  expect(screen.queryByTestId('event-button')).toBeNull();
  expect(screen.queryByTestId('event-card-banner')).toBeNull();
  rerender(<EventButton event={event} />);
  expect(screen.getByTestId('event-button')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});
