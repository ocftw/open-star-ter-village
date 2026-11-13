/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import JobTile from './JobTile';

const states = ['default', 'focused', 'generalHint'] as const;

// jsdom checks the component contract at both viewport widths; shots.mjs checks
// the actual responsive CSS, dimensions and overflow in Chromium.
describe.each([1280, 390])('JobTile at %ipx', (width) => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });

  it.each([
    ['工程師', '/characters/engineer.png'],
    ['美術設計', '/characters/designer.png'],
    ['公務人員', '/characters/civil-servant.png'],
    ['法務專家', '/characters/legal.png'],
    ['文字工作者', '/characters/writer.png'],
    ['議題工作者', '/characters/issue-worker.png'],
    ['行銷公關', '/characters/marketing.png'],
  ])('shows the character avatar and name for %s', (name, image) => {
    render(<JobTile id="role" name={name} />);
    const card = screen.getByTestId('job-card-role');
    expect(within(card).getByText(name)).toBeTruthy();
    expect(within(card).getByRole('img', { name }).getAttribute('src')).toBe(image);
    expect(card.getAttribute('data-job-name')).toBe(name);
    expect(card.getAttribute('data-visual-state')).toBe('default');
    expect(card.hasAttribute('data-selected')).toBe(false);
  });

  it.each(states)('keeps the %s visual state and tap callback', (visualState) => {
    const onClick = jest.fn();
    render(<JobTile id="market-1" name="文字工作者" visualState={visualState} onClick={onClick} />);
    const card = screen.getByRole('button', { name: '文字工作者' });
    expect(card.getAttribute('data-testid')).toBe('job-card-market-1');
    expect(card.getAttribute('data-job-name')).toBe('文字工作者');
    expect(card.getAttribute('data-visual-state')).toBe(visualState);
    expect(card.hasAttribute('data-selected')).toBe(false);
    expect(within(card).getByRole('img', { name: '文字工作者' })).toBeTruthy();
    expect(card.querySelector('.job-tile-change')).toBeNull();
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('maps selection to Focused and preserves the market e2e selectors', () => {
    const onClick = jest.fn();
    const { container, rerender } = render(
      <JobTile id="market-2" name="行銷公關" selected onClick={onClick} />,
    );
    const card = screen.getByTestId('job-card-market-2');
    expect(card.getAttribute('data-visual-state')).toBe('focused');
    expect(card.getAttribute('data-selected')).toBe('true');
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-testid^="job-card-"][data-selected]')).toBe(card);
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<JobTile id="market-2" name="行銷公關" selected={false} onClick={onClick} />);
    expect(card.getAttribute('data-visual-state')).toBe('default');
    expect(card.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-testid^="job-card-"][data-selected]')).toBeNull();
  });

  it.each(states)('honors explicit %s while preserving selection', (visualState) => {
    render(<JobTile id="selected" name="工程師" selected visualState={visualState} />);
    const card = screen.getByTestId('job-card-selected');
    expect(card.getAttribute('data-visual-state')).toBe(visualState);
    expect(card.getAttribute('data-selected')).toBe('true');
  });

  it('leaves a non-interactive market tile out of the tab order', () => {
    render(<JobTile id="inactive" name="工程師" />);
    expect((screen.getByRole('button', { name: '工程師' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('change: unmuted tile (not a button) with a sibling red × that removes', () => {
    const onRemove = jest.fn();
    const onClick = jest.fn();
    const { container } = render(
      <JobTile id="r1" name="工程師" visualState="change" onRemove={onRemove} onClick={onClick} />,
    );
    const tile = screen.getByTestId('job-card-r1');
    expect(tile.tagName).toBe('DIV');
    expect(tile.getAttribute('data-visual-state')).toBe('change');
    expect(tile.querySelector('button')).toBeNull();
    expect(container.querySelector('[title="即將更換"]')).toBeNull();
    expect(container.textContent).not.toContain('↻');
    fireEvent.click(tile);
    expect(onRemove).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    const remove = screen.getByRole('button', { name: '移除 工程師' });
    expect(remove.parentElement).toBe(tile.parentElement);
    expect(remove.textContent).toBe('×');
    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('ghost: removed tile has no × and no controls', () => {
    const { container } = render(
      <JobTile id="r2" name="美術設計" visualState="ghost" onRemove={jest.fn()} />,
    );
    const tile = screen.getByTestId('job-card-r2');
    expect(tile.getAttribute('data-visual-state')).toBe('ghost');
    expect(container.querySelector('button')).toBeNull();
    expect(within(tile).getByText('美術設計')).toBeTruthy();
  });
});
