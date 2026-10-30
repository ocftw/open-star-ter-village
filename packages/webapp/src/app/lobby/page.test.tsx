/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LobbyPage from './page';
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/GameIntentTracker', () => ({ __esModule:true,default:()=>null }));
jest.mock('@/components/lobby/LobbyNav', () => ({ __esModule:true,default:()=>null }));
jest.mock('./actions', () => ({ listPublicMatches:jest.fn().mockResolvedValue([]), getLobbyErrorMessage:()=>'', createRoom:jest.fn(), LobbyError:class extends Error {} }));
jest.mock('@/game/standard/config', () => ({ ...jest.requireActual('@/game/standard/config'), STANDARD_RULES_ENABLED:true }));

test('Standard room selector offers exactly 2, 3 and 4 players', async () => {
  render(<LobbyPage/>);
  await waitFor(()=>expect(screen.queryByText('載入中… Loading matches…')).toBeNull());
  fireEvent.change(screen.getByLabelText('遊戲規則'),{target:{value:'tree-poc-v1'}});
  for(const n of ['2','3','4']) expect(screen.getByRole('button',{name:n})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'5'})).toBeNull();
});
test('disabled switch hides Standard and retains Simplified player choices', async () => {
  (jest.requireMock('@/game/standard/config') as { STANDARD_RULES_ENABLED:boolean }).STANDARD_RULES_ENABLED=false;
  try {
    render(<LobbyPage/>);
    await waitFor(()=>expect(screen.queryByText('載入中… Loading matches…')).toBeNull());
    expect(screen.queryByLabelText('遊戲規則')).toBeNull();
    expect(screen.getByRole('button',{name:'6'})).toBeTruthy();
  } finally { (jest.requireMock('@/game/standard/config') as { STANDARD_RULES_ENABLED:boolean }).STANDARD_RULES_ENABLED=true; }
});

test('Standard exposes room options, fixed Government 5 text and independent rewards', async () => {
  render(<LobbyPage/>);
  await waitFor(()=>expect(screen.queryByText('載入中… Loading matches…')).toBeNull());
  expect(screen.queryByLabelText('政府 5 分配範圍')).toBeNull();
  fireEvent.change(screen.getByLabelText('遊戲規則'),{target:{value:'tree-poc-v1'}});
  expect(screen.queryByLabelText('政府 5 分配範圍')).toBeNull();
  const rewards=screen.getByLabelText('發起／結案獎勵') as HTMLSelectElement;
  expect(rewards.value).toBe('fixed');
  expect((screen.getByRole('radio', { name: '不輪替' }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText(/共 6 輪/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '4' }));
  fireEvent.click(screen.getByRole('radio', { name: '+2 輪' }));
  fireEvent.click(screen.getByRole('radio', { name: '逆時針' }));
  fireEvent.click(screen.getByRole('radio', { name: '結案複雜度 CC 0／1／3／6／10' }));
  expect(screen.getByText(/共 7 輪.*先手逆時針.*0／1／3／6／10/)).toBeTruthy();
  fireEvent.change(rewards,{target:{value:'difficulty'}});
  expect(rewards.value).toBe('difficulty');
});
