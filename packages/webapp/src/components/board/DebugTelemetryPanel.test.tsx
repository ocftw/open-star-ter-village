/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DebugTelemetryPanel from './DebugTelemetryPanel';
import type { GameContext } from '../GameContextHelpers';
import { playerView } from '@/game/core/playerView';
import { createProfileBot } from '@/game/bots/profileBot';
import { NOVICE } from '@/game/bots/profiles';
import { runGame } from '@/game/bots/runner';

const run = runGame({ numPlayers: 2, seed: 'debug-panel', bots: createProfileBot(NOVICE) });
const gameContext = {
  G: playerView({ G: run.state.G, ctx: run.state.ctx, playerID: '0' }),
  ctx: run.state.ctx,
  matchID: 'match-1',
  matchData: undefined,
} as unknown as GameContext;

function mockFetch(response: { ok: boolean; body?: unknown }) {
  const fetchMock = jest.fn().mockResolvedValue({ ok: response.ok, json: async () => response.body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('DebugTelemetryPanel', () => {
  test('renders nothing when the server has no debug endpoint', async () => {
    const fetchMock = mockFetch({ ok: false });
    const { container } = render(<DebugTelemetryPanel gameContext={gameContext} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/debug/matches/match-1/telemetry')));
    expect(container.innerHTML).toBe('');
  });

  test('shows projects and Government 5 usage from the debug endpoint', async () => {
    const telemetry = run.state.G.standard!.telemetry!;
    mockFetch({ ok: true, body: { matchID: 'match-1', telemetry } });
    render(<DebugTelemetryPanel gameContext={gameContext} />);
    const panel = await screen.findByTestId('debug-telemetry');
    const firstProject = Object.values(telemetry.projects)[0];
    expect(panel.textContent).toContain(firstProject.name);
    expect(panel.textContent).toContain(`政府5 預算 ${telemetry.government5.used}／${telemetry.government5.budget}`);
  });
});
