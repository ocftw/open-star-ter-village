/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function Fire({ label, message, kind }: { label: string; message: string; kind?: 'error' | 'success' | 'info' }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast(message, kind)}>
      {label}
    </button>
  );
}

describe('sticker toast system', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows a toast with its kind and dismisses on click', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <ToastProvider>
        <Fire label="fire" message="貢獻 3 點" kind="success" />
      </ToastProvider>,
    );
    fireEvent.click(getByText('fire'));
    const toast = getByTestId('toast');
    expect(toast.getAttribute('data-kind')).toBe('success');
    expect(toast.textContent).toContain('貢獻 3 點');
    fireEvent.click(toast);
    expect(queryByTestId('toast')).toBeNull();
  });

  it('auto-dismisses after the duration', () => {
    const { getByText, queryByTestId } = render(
      <ToastProvider>
        <Fire label="fire" message="msg" />
      </ToastProvider>,
    );
    fireEvent.click(getByText('fire'));
    expect(queryByTestId('toast')).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(5100);
    });
    expect(queryByTestId('toast')).toBeNull();
  });

  it('only failures interrupt the screen reader', () => {
    const { getByText, getAllByTestId } = render(
      <ToastProvider>
        <Fire label="err" message="failed" kind="error" />
        <Fire label="ok" message="done" kind="success" />
        <Fire label="fyi" message="note" kind="info" />
      </ToastProvider>,
    );
    fireEvent.click(getByText('err'));
    fireEvent.click(getByText('ok'));
    fireEvent.click(getByText('fyi'));
    const roles = getAllByTestId('toast').map((t) => t.getAttribute('role'));
    // Assertive only for errors; progress updates queue politely.
    expect(roles).toEqual(['alert', 'status', 'status']);
  });

  it('caps the visible stack at 4, dropping the oldest', () => {
    const { getByText, getAllByTestId } = render(
      <ToastProvider>
        <Fire label="fire" message="msg" />
      </ToastProvider>,
    );
    for (let i = 0; i < 6; i++) {
      fireEvent.click(getByText('fire'));
    }
    expect(getAllByTestId('toast')).toHaveLength(4);
  });
});
