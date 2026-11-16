/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { GameContext } from '@/components/GameContextHelpers';
import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';
import { ScorePanel } from './SidePanels';

function context(scores = [2, 8, 4, 0], playerID: string | null = '1'): GameContext {
  const G = GameStore.initialState();
  const seats = scores.map((_, index) => String(index));
  PlayersMutator.initialize(G.players, seats);
  ScoreBoardMutator.initialize(G.table.scoreBoard, seats);
  seats.forEach((id, index) => {
    ScoreBoardMutator.add(G.table.scoreBoard, id, scores[index]);
    PlayersMutator.resetWorkerTokens(G.players, id, 12 - index * 3);
    PlayersMutator.resetActionTokens(G.players, id, 4 - index);
  });
  // Turn order can rotate; ties must still use the seats, not this order.
  G.playOrder = [...seats].reverse();
  return { G, playerID } as unknown as GameContext;
}

const rowNames = () => screen.getAllByRole('listitem').map((row) => row.getAttribute('data-testid'));
const barWidth = (name: string) => (screen.getByRole('meter', { name }).firstElementChild as HTMLElement).style.width;

describe('ScorePanel influence ranking', () => {
  it('ranks all four players by descending score with consecutive rank numbers', () => {
    render(<ScorePanel gameContext={context()} />);
    expect(screen.getByRole('heading', { name: '影響力排行' })).toBeTruthy();
    expect(rowNames()).toEqual(['ranking-row-Bob', 'ranking-row-Charlie', 'ranking-row-Alice', 'ranking-row-Dave']);
    screen.getAllByRole('listitem').forEach((row, index) => {
      expect(row.firstElementChild?.textContent).toBe(String(index + 1));
    });
  });

  it('retains seat order on ties, including when the turn order is reversed', () => {
    render(<ScorePanel gameContext={context([4, 8, 8, 4])} />);
    expect(rowNames()).toEqual(['ranking-row-Bob', 'ranking-row-Charlie', 'ranking-row-Alice', 'ranking-row-Dave']);
  });

  it('normalizes scores against the leader and workers against the active rules', () => {
    const gameContext = context();
    gameContext.G.rules.player.maxWorkerTokens = 24;
    render(<ScorePanel gameContext={gameContext} />);
    expect(barWidth('Bob 影響力')).toBe('100%');
    expect(barWidth('Charlie 影響力')).toBe('50%');
    expect(barWidth('Alice 影響力')).toBe('25%');
    expect(barWidth('Dave 影響力')).toBe('0%');
    expect(barWidth('Alice 剩餘人力')).toBe('50%');
    expect(barWidth('Charlie 剩餘人力')).toBe('25%');
    expect(screen.getByRole('meter', { name: 'Alice 剩餘人力' }).getAttribute('aria-valuemax')).toBe('24');
  });

  it('uses the actual top score even when it is below six', () => {
    render(<ScorePanel gameContext={context([1, 2])} />);
    expect(barWidth('Bob 影響力')).toBe('100%');
    expect(barWidth('Alice 影響力')).toBe('50%');
  });

  it('renders empty, finite score bars when everyone has zero points', () => {
    render(<ScorePanel gameContext={context([0, 0, 0, 0])} />);
    expect(rowNames()).toEqual(['ranking-row-Alice', 'ranking-row-Bob', 'ranking-row-Charlie', 'ranking-row-Dave']);
    for (const name of ['Alice', 'Bob', 'Charlie', 'Dave']) {
      expect(barWidth(`${name} 影響力`)).toBe('0%');
      expect(screen.getByRole('meter', { name: `${name} 影響力` }).getAttribute('aria-valuemax')).toBe('1');
    }
  });

  it('pads remaining workers to two digits and exposes the unpadded live data', () => {
    const gameContext = context();
    gameContext.G.players['3'].token.workers = 0;
    render(<ScorePanel gameContext={gameContext} />);
    const bob = screen.getByTestId('ranking-row-Bob');
    expect(within(bob).getByText('09')).toBeTruthy();
    expect(bob.getAttribute('data-score')).toBe('8');
    expect(bob.getAttribute('data-workers')).toBe('9');
    expect(bob.getAttribute('data-actions')).toBe('3');
    expect(bob.getAttribute('data-you')).toBe('true');
    expect(within(screen.getByTestId('ranking-row-Alice')).getByText('12')).toBeTruthy();
    expect(within(screen.getByTestId('ranking-row-Dave')).getByText('00')).toBeTruthy();
    expect(barWidth('Dave 剩餘人力')).toBe('0%');
    expect(barWidth('Alice 剩餘人力')).toBe('100%');
  });

  it('highlights only the viewing player’s name with the AA-contrast orange class', () => {
    render(<ScorePanel gameContext={context()} />);
    expect(screen.getByText('Bob').className).toContain('influence-ranking-name-you');
    expect(screen.getByText('Alice').className).not.toContain('influence-ranking-name-you');
    expect(screen.getByTestId('ranking-row-Alice').getAttribute('data-you')).toBe('false');
  });

  it('shows two players to an observer without highlighting either name', () => {
    render(<ScorePanel gameContext={context([0, 1], null)} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    for (const row of screen.getAllByRole('listitem')) {
      expect(row.getAttribute('data-you')).toBe('false');
    }
    expect(screen.getByText('Bob').style.color).toBe('');
  });

  it('preserves four long lobby names in text, titles and row hooks', () => {
    const gameContext = context();
    const names = ['很長很長的第一位玩家名稱', 'An exceptionally long player name', '第三位玩家也有很長的名字', 'Fourth player with a long display name'];
    gameContext.matchData = names.map((name, id) => ({ id, name }));
    render(<ScorePanel gameContext={gameContext} />);
    for (const name of names) {
      expect(screen.getByTitle(name).textContent).toBe(name);
      expect(screen.getByTestId(`ranking-row-${name}`)).toBeTruthy();
    }
  });
});
