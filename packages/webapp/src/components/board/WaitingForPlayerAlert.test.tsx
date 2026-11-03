/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import WaitingForPlayerAlert from './WaitingForPlayerAlert';

describe('WaitingForPlayerAlert', () => {
  it('shows the generic waiting note during a normal turn', () => {
    render(<WaitingForPlayerAlert playerName="Charlie" pendingDiscard={false} />);
    const alert = screen.getByTestId('waiting-for-player-alert');
    expect(alert.textContent).toContain('等待 Charlie 行動中…');
    expect(alert.textContent).not.toContain('四大自由');
  });

  it('names the player who owes the 四大自由 discard', () => {
    render(<WaitingForPlayerAlert playerName="Charlie" pendingDiscard />);
    const alert = screen.getByTestId('waiting-for-player-alert');
    expect(alert.textContent).toContain('等待 Charlie 移除 2 張人力卡（四大自由）');
    expect(alert.getAttribute('data-pending-discard')).toBe('true');
    expect(alert.getAttribute('role')).toBe('status');
  });
});
