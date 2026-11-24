/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ContributionConfirmBar from './ContributionConfirmBar';

it('shows one strip only for positive pending, with separate cancel and confirm actions', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const bar = (total: number, canConfirm = true) => (
    <ContributionConfirmBar total={total} max={5} canConfirm={canConfirm} onCancel={onCancel} onConfirm={onConfirm} />
  );
  const { rerender } = render(bar(0));
  expect(screen.queryByRole('group', { name: '貢獻確認' })).toBeNull();
  rerender(bar(3));
  expect(screen.getAllByRole('group', { name: '貢獻確認' })).toHaveLength(1);
  ['貢獻 +3', '最多 +5', '剩餘 2'].forEach((text) => expect(screen.getByText(text)).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '確認貢獻' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  rerender(bar(5, false));
  expect(screen.getByText('剩餘 0')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '確認貢獻' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  rerender(bar(0));
  expect(screen.queryByTestId('ca-confirm')).toBeNull();
});
