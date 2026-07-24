/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import ExitDialog from './ExitDialog';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const leaveRoomMock = jest.fn();
jest.mock('@/app/lobby/actions', () => ({
  leaveRoom: (...args: unknown[]) => leaveRoomMock(...args),
  getLobbyErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

const CREDS_KEY = 'open-star-ter-village.match-credentials.room-1';
const seedCredentials = () => {
  localStorage.setItem(
    CREDS_KEY,
    JSON.stringify({ matchID: 'room-1', playerID: '1', credential: 'secret', playerName: 'Bob' }),
  );
};

describe('ExitDialog (#420)', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    leaveRoomMock.mockReset();
  });

  it('offers the three explicit choices and does not navigate on open', () => {
    const { getByRole, getByTestId } = render(<ExitDialog open onClose={jest.fn()} matchID="room-1" />);
    const dialog = getByRole('dialog', { name: '要離開嗎？' });
    expect(dialog.getAttribute('aria-describedby')).toBe('exit-dialog-description');
    expect(getByTestId('exit-keep-seat')).toBeTruthy();
    expect(getByTestId('exit-leave-seat')).toBeTruthy();
    expect(getByTestId('exit-cancel')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
    expect(leaveRoomMock).not.toHaveBeenCalled();
  });

  it('回大廳 navigates without releasing the seat or touching credentials', () => {
    seedCredentials();
    const { getByTestId } = render(<ExitDialog open onClose={jest.fn()} matchID="room-1" />);
    fireEvent.click(getByTestId('exit-keep-seat'));
    expect(pushMock).toHaveBeenCalledWith('/lobby');
    expect(leaveRoomMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(CREDS_KEY)).not.toBeNull();
  });

  it('離開座位 releases the seat, clears credentials, then navigates', async () => {
    seedCredentials();
    leaveRoomMock.mockResolvedValue(undefined);
    const { getByTestId } = render(<ExitDialog open onClose={jest.fn()} matchID="room-1" />);
    fireEvent.click(getByTestId('exit-leave-seat'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/lobby'));
    expect(leaveRoomMock).toHaveBeenCalledWith('room-1', '1', 'secret');
    expect(localStorage.getItem(CREDS_KEY)).toBeNull();
  });

  it('a failed leave keeps credentials, shows the error, and stays open', async () => {
    seedCredentials();
    leaveRoomMock.mockRejectedValue(new Error('boom'));
    const { getByTestId, getByRole } = render(<ExitDialog open onClose={jest.fn()} matchID="room-1" />);
    fireEvent.click(getByTestId('exit-leave-seat'));
    await waitFor(() => expect(getByRole('alert')).toBeTruthy());
    expect(pushMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(CREDS_KEY)).not.toBeNull();
  });

  it('取消 closes without any side effect', () => {
    seedCredentials();
    const onClose = jest.fn();
    const { getByTestId } = render(<ExitDialog open onClose={onClose} matchID="room-1" />);
    fireEvent.click(getByTestId('exit-cancel'));
    expect(onClose).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(leaveRoomMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(CREDS_KEY)).not.toBeNull();
  });

  it('Escape requests dismissal through the native cancel event', () => {
    const onClose = jest.fn();
    const { getByRole } = render(<ExitDialog open onClose={onClose} matchID="room-1" />);
    fireEvent(getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('without saved credentials 離開座位 just returns to the lobby', async () => {
    const { getByTestId } = render(<ExitDialog open onClose={jest.fn()} matchID="room-1" />);
    fireEvent.click(getByTestId('exit-leave-seat'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/lobby'));
    expect(leaveRoomMock).not.toHaveBeenCalled();
  });
});
