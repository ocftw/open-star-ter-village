'use client';

import React from 'react';
import type { Game } from 'boardgame.io';
import GameView from '@/components/GameView';
import DevToolsWidget from '@/components/dev/DevToolsWidget';
import {
  getPlayerID,
  type DevPerspective,
  type DevTransport,
} from '@/components/dev/devConfig';
import game, { type GameState } from '@/game';
import { setup, type GameSetupData } from '@/game/core/setup';

const NUM_DEV_PLAYERS = 3;

function createMatchID(): string {
  return `dev-${window.crypto.randomUUID()}`;
}

function updateDevURL(perspective: DevPerspective, transport: DevTransport): void {
  const url = new URL(window.location.href);
  url.searchParams.set('user', perspective);
  url.searchParams.set('mode', transport);
  window.history.replaceState(window.history.state, '', url);
}

export default function DevGameHost({
  initialMatchID,
  initialPerspective,
  initialTransport,
  demo,
  seed,
}: {
  initialMatchID: string;
  initialPerspective: DevPerspective;
  initialTransport: DevTransport;
  demo?: string;
  seed?: string;
}) {
  const [perspective, setPerspective] = React.useState(initialPerspective);
  const [transport, setTransport] = React.useState(initialTransport);
  const [matchID, setMatchID] = React.useState(initialMatchID);

  React.useEffect(() => {
    updateDevURL(perspective, transport);
  }, [perspective, transport]);

  const localGameConfig = React.useMemo((): Game<GameState> => {
    const seededGame = seed ? { ...game, seed } : game;
    if (demo !== 'four-freedoms') {
      return seededGame;
    }

    const setupData: GameSetupData = { forcedFirstEvent: 'add_two_worker_slots' };
    return {
      ...seededGame,
      setup: (ctx: Parameters<typeof setup>[0]) => setup(ctx, setupData),
    };
  }, [demo, seed]);

  const handlePerspectiveChange = (nextPerspective: DevPerspective) => {
    setPerspective(nextPerspective);
  };

  const handleTransportChange = (nextTransport: DevTransport) => {
    if (nextTransport === transport) {
      return;
    }

    setTransport(nextTransport);
    setMatchID(createMatchID());
  };

  return (
    <GameView
      boardKey={`${transport}-${perspective}`}
      isLocal={transport === 'offline'}
      matchID={matchID}
      playerID={getPlayerID(perspective)}
      numPlayers={NUM_DEV_PLAYERS}
      gameConfig={transport === 'offline' ? localGameConfig : undefined}
      widgets={
        <DevToolsWidget
          perspective={perspective}
          transport={transport}
          onPerspectiveChange={handlePerspectiveChange}
          onTransportChange={handleTransportChange}
          hasLocalSetupOverrides={Boolean(seed || demo)}
        />
      }
    />
  );
}
