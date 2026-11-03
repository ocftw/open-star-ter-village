/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GameOverNote from './GameOverNote';

describe('GameOverNote', () => {
  it('says the game is over instead of waiting and reopens the results', () => {
    const onShowResults = jest.fn();
    render(<GameOverNote onShowResults={onShowResults} />);
    const note = screen.getByTestId('game-over-note');
    expect(note.textContent).toContain('遊戲結束');
    expect(note.textContent).not.toContain('等待');
    fireEvent.click(screen.getByTestId('show-game-results'));
    expect(onShowResults).toHaveBeenCalledTimes(1);
  });
});
