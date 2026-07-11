'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, FormControlLabel, Switch } from '@mui/material';
import Boardgame from '@/components/BoardGame';
import game from '@/game';
import { GameSetupData, setup } from '@/game/core/setup';
import { Game } from 'boardgame.io';
import { GameState } from '@/game';
import { playerNameMap } from './playerNameMap';
import TabPanel from './TabPanel';

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const DevView: React.FC<{
  demo?: string;
  seed?: string;
  initialMode?: 'offline' | 'online';
  isDev?: boolean;
}> = ({ demo, seed, initialMode = 'offline', isDev = false }) => {
  const [value, setValue] = useState(0);
  const [mode, setMode] = useState<'offline' | 'online'>(initialMode);
  const [matchID, setMatchID] = useState(() => `dev-${Date.now()}`);

  const handleModeChange = () => {
    const next = mode === 'offline' ? 'online' : 'offline';
    setMode(next);
    setMatchID(`dev-${Date.now()}`);
  };

  // Create a SINGLE stable game config object shared by all Boardgame instances.
  // boardgame.io's Local transport caches the master by game object reference (gameKey),
  // so all clients for the same match must share the same game object.
  const gameConfig = React.useMemo((): Game<GameState> => {
    const seededGame = seed ? { ...game, seed } : game;
    if (demo !== 'four-freedoms') return seededGame;
    const setupData: GameSetupData = { forcedFirstEvent: 'add_two_worker_slots' };
    return { ...seededGame, setup: (ctx: Parameters<typeof setup>[0]) => setup(ctx, setupData) };
  }, [demo, seed]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (!isDev) {
    return <Boardgame isLocal={mode === 'offline'} matchID={matchID} playerID="0" gameConfig={gameConfig} />;
  }

  return (
    <>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, backgroundColor: 'background.paper', display: 'flex', alignItems: 'center' }}>
        <Tabs value={value} onChange={handleChange} aria-label="player tabs">
          <Tab label={`${playerNameMap["0"]} view`} {...a11yProps(0)} />
          <Tab label={`${playerNameMap["1"]} view`} {...a11yProps(1)} />
          <Tab label={`${playerNameMap["2"]} view`} {...a11yProps(2)} />
          <Tab label="Observer view" {...a11yProps(3)} />
        </Tabs>
        <FormControlLabel
          control={<Switch checked={mode === 'online'} onChange={handleModeChange} size="small" />}
          label={mode === 'offline' ? 'Offline' : 'Online'}
          sx={{ ml: 'auto', mr: 2 }}
        />
      </Box>
      <TabPanel value={value} index={0}>
        <Boardgame isLocal={mode === 'offline'} matchID={matchID} playerID="0" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Boardgame isLocal={mode === 'offline'} matchID={matchID} playerID="1" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Boardgame isLocal={mode === 'offline'} matchID={matchID} playerID="2" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Boardgame isLocal={mode === 'offline'} matchID={matchID} gameConfig={gameConfig} />
      </TabPanel>
    </>
  );
};

export default DevView;
