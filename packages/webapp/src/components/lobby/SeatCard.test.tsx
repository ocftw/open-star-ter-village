/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SeatCard from './SeatCard';

const balanced = { id: 'balanced', label: '平衡型 Balanced' };

describe('SeatCard bot seats', () => {
  test('an empty seat offers Add bot only when the host can manage bots', () => {
    const onAddBot = jest.fn();
    const { rerender } = render(<SeatCard seatIndex={1} botStrategies={[balanced]} />);
    expect(screen.queryByTestId('seat-1-add-bot')).toBeNull();

    rerender(<SeatCard seatIndex={1} botStrategies={[balanced]} onAddBot={onAddBot} />);
    fireEvent.click(screen.getByTestId('seat-1-add-bot'));
    expect(onAddBot).toHaveBeenCalledWith('balanced');
  });

  test('with several strategies, the host picks one before adding', () => {
    const onAddBot = jest.fn();
    render(<SeatCard seatIndex={2} botStrategies={[balanced, { id: 'rusher', label: '衝樹型' }]} onAddBot={onAddBot} />);
    fireEvent.change(screen.getByLabelText(/Seat 2 電腦策略/), { target: { value: 'rusher' } });
    fireEvent.click(screen.getByTestId('seat-2-add-bot'));
    expect(onAddBot).toHaveBeenCalledWith('rusher');
  });

  test('a bot seat shows its strategy and a remove control for the host', () => {
    const onRemoveBot = jest.fn();
    const { rerender } = render(<SeatCard seatIndex={1} playerName="阿衡" botLabel="平衡型 Balanced" />);
    expect(screen.getByTestId('seat-1-bot').textContent).toContain('平衡型 Balanced');
    expect(screen.getByTestId('seat-1-filled').textContent).toContain('BOT');
    expect(screen.queryByTestId('seat-1-remove-bot')).toBeNull();

    rerender(<SeatCard seatIndex={1} playerName="阿衡" botLabel="平衡型 Balanced" onRemoveBot={onRemoveBot} />);
    fireEvent.click(screen.getByTestId('seat-1-remove-bot'));
    expect(onRemoveBot).toHaveBeenCalled();
  });

  test('a human seat shows Seated, not a bot badge', () => {
    render(<SeatCard seatIndex={0} playerName="Ben" isHost />);
    expect(screen.queryByTestId('seat-0-bot')).toBeNull();
    expect(screen.getByTestId('seat-0-filled').textContent).toContain('Seated');
  });
});
