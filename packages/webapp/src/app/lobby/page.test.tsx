/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LobbyPage from './page';
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/GameIntentTracker', () => ({ __esModule:true,default:()=>null }));
jest.mock('@/components/lobby/LobbyNav', () => ({ __esModule:true,default:()=>null }));
jest.mock('./actions', () => ({ listPublicMatches:jest.fn().mockResolvedValue([]), getLobbyErrorMessage:()=>'', createRoom:jest.fn(), LobbyError:class extends Error {} }));
jest.mock('@/game/standard/config', () => ({ STANDARD_RULES_ENABLED:true }));

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
