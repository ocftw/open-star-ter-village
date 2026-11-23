/** @jest-environment jsdom */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { GameContext } from '@/components/GameContextHelpers';
import ProjectArea from './ProjectArea';

jest.mock('./BoardProjectSlot', () => ({
  __esModule: true,
  default: ({ slot }: { slot: { id: string } }) => <div data-testid={slot.id} />,
}));
jest.mock('@/game/store/slice/rule', () => ({
  RuleSelector: { getTableMaxProjectSlots: () => 8 },
}));

const slot = (id: string, owner: string, occupied = true) => ({ id, owner, card: occupied ? { name: id } : undefined });

function renderArea(board: ReturnType<typeof slot>[], playerID: string | null) {
  const ctx = { G: { rules: {}, table: { projectBoard: board } }, playerID } as unknown as GameContext;
  const ref = React.createRef<HTMLDivElement>();
  return render(<ProjectArea gameContext={ctx} projectsRef={ref} professionPickerFor={() => undefined} />);
}
const pad = (items: ReturnType<typeof slot>[]) =>
  [...items, ...Array.from({ length: 8 - items.length }, (_, i) => slot(`e${i}`, '0', false))];

it('renders both sections with empty copy and the hint', () => {
  renderArea(pad([]), '0');
  expect(screen.getByRole('region', { name: '你的專案' })).toBeTruthy();
  expect(screen.getByText('還沒有發起專案。按右側「發起專案」開始。')).toBeTruthy();
  expect(screen.getByText('其他玩家還沒有發起專案。')).toBeTruthy();
  const hint = screen.getByTestId('project-capacity');
  expect(hint.textContent).toBe('ⓘ 場上最多八張專案卡');
  expect(hint.getAttribute('data-available')).toBe('8');
  expect(hint.getAttribute('data-capacity')).toBe('8');
});

it('places cards by owner with long player names across 4 players', () => {
  renderArea(pad([slot('p0', '0'), slot('p1', '1'), slot('p2', '2'), slot('p3', '3')]), '0');
  expect(within(screen.getByTestId('projects-yours')).getByTestId('p0')).toBeTruthy();
  const others = within(screen.getByTestId('projects-others'));
  ['p1', 'p2', 'p3'].forEach((id) => expect(others.getByTestId(id)).toBeTruthy());
});

it('marks a full board 已滿', () => {
  renderArea(Array.from({ length: 8 }, (_, i) => slot(`s${i}`, String(i % 2))), '0');
  const hint = screen.getByTestId('project-capacity');
  expect(hint.textContent).toBe('ⓘ 場上最多八張專案卡 · 已滿');
  expect(hint.getAttribute('data-available')).toBe('0');
});

it('observers have no 你的專案 and carry the hint under 他人的專案', () => {
  renderArea(pad([slot('p0', '0')]), null);
  expect(screen.queryByTestId('projects-yours')).toBeNull();
  const others = within(screen.getByTestId('projects-others'));
  expect(others.getByTestId('p0')).toBeTruthy();
  expect(others.getByTestId('project-capacity')).toBeTruthy();
});
