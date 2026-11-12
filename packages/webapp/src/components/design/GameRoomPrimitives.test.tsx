/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button, IconButton, Toast, TOAST_DURATION_MS } from '@/components/design';
import type { ButtonProps } from '@/components/design';

describe('Button', () => {
  it('defaults to a medium primary type="button"', () => {
    render(<Button>確認</Button>);
    const button = screen.getByRole('button', { name: '確認' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toBe('gr-btn gr-btn--medium gr-btn--primary');
  });

  it.each([
    ['small', 'primary'],
    ['small', 'sec'],
    ['medium', 'tri'],
    ['large', 'sec'],
  ] as const)('applies size %s and variant %s classes', (size, variant) => {
    render(
      <Button {...({ size, variant } as ButtonProps)} className="extra">
        Go
      </Button>,
    );
    const { classList } = screen.getByRole('button');
    expect(classList.contains(`gr-btn--${size}`)).toBe(true);
    expect(classList.contains(`gr-btn--${variant}`)).toBe(true);
    expect(classList.contains('extra')).toBe(true);
  });

  it('rejects the Small × Tri combination at the type level', () => {
    // @ts-expect-error Figma has no Small Tri button
    const element = <Button size="small" variant="tri">x</Button>;
    expect(element).toBeTruthy();
  });

  it('forwards clicks and blocks them when disabled', () => {
    const onClick = jest.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button onClick={onClick} disabled>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('IconButton', () => {
  it('exposes its label as the accessible name and hides the icon', () => {
    const onClick = jest.fn();
    render(
      <IconButton label="下一張 Next" onClick={onClick}>
        <svg data-testid="icon" />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: '下一張 Next' });
    expect(button.getAttribute('type')).toBe('button');
    expect(screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps an empty status live region mounted while closed', () => {
    render(<Toast open={false} onClose={jest.fn()}>已達到貢獻值上限</Toast>);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');
    expect(screen.queryByRole('button', { name: '關閉提示' })).toBeNull();
  });

  it('shows the message and dismisses after 2 seconds', () => {
    const onClose = jest.fn();
    render(<Toast open onClose={onClose}>已達到貢獻值上限</Toast>);
    expect(screen.getByRole('status').textContent).toBe('已達到貢獻值上限');
    expect(TOAST_DURATION_MS).toBe(2000);

    act(() => jest.advanceTimersByTime(1999));
    expect(onClose).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not restart the timer when the parent re-renders with a new onClose', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<Toast open onClose={first}>msg</Toast>);
    act(() => jest.advanceTimersByTime(1500));
    rerender(<Toast open onClose={second}>msg</Toast>);
    act(() => jest.advanceTimersByTime(500));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('dismisses immediately and cancels the auto-hide timer', () => {
    const onClose = jest.fn();
    render(<Toast open onClose={onClose}>已達到貢獻值上限</Toast>);
    act(() => jest.advanceTimersByTime(1500));
    fireEvent.click(screen.getByRole('button', { name: '關閉提示' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('已達到貢獻值上限');

    act(() => jest.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restarts the 2-second timer when resetKey changes while open', () => {
    const onClose = jest.fn();
    const { rerender } = render(<Toast open resetKey={1} onClose={onClose}>msg</Toast>);
    const region = screen.getByRole('status');
    act(() => jest.advanceTimersByTime(1500));
    rerender(<Toast open resetKey={2} onClose={onClose}>msg</Toast>);
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('msg');
    act(() => jest.advanceTimersByTime(1500));
    expect(onClose).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(500));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels the timer when closed early or unmounted', () => {
    const onClose = jest.fn();
    const { rerender, unmount } = render(<Toast open onClose={onClose}>msg</Toast>);
    rerender(<Toast open={false} onClose={onClose}>msg</Toast>);
    act(() => jest.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).not.toHaveBeenCalled();

    rerender(<Toast open onClose={onClose}>msg</Toast>);
    unmount();
    act(() => jest.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).not.toHaveBeenCalled();
  });
});
