'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
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

const DevView: React.FC<{ isLocal: boolean; demo?: string }> = ({ isLocal, demo }) => {
  const [value, setValue] = useState(0);
  // Use a unique matchID per page load so each navigation starts a fresh game.
  const [matchID] = useState(() => `dev-${Date.now()}`);

  // Create a SINGLE stable game config object shared by all Boardgame instances.
  // boardgame.io's Local transport caches the master by game object reference (gameKey),
  // so all clients for the same match must share the same game object.
  const gameConfig = React.useMemo((): Game<GameState> => {
    if (demo !== 'four-freedoms') return game;
    const setupData: GameSetupData = { forcedFirstEvent: 'add_two_worker_slots' };
    return { ...game, setup: (ctx: Parameters<typeof setup>[0]) => setup(ctx, setupData) };
  // demo is derived from URL — stable for the lifetime of this DevView
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, backgroundColor: 'background.paper' }}>
        <Tabs value={value} onChange={handleChange} aria-label="player tabs">
          <Tab label={`${playerNameMap["0"]} view`} {...a11yProps(0)} />
          <Tab label={`${playerNameMap["1"]} view`} {...a11yProps(1)} />
          <Tab label={`${playerNameMap["2"]} view`} {...a11yProps(2)} />
          <Tab label="Observer view" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Boardgame isLocal={isLocal} matchID={matchID} playerID="0" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Boardgame isLocal={isLocal} matchID={matchID} playerID="1" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Boardgame isLocal={isLocal} matchID={matchID} playerID="2" gameConfig={gameConfig} />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Boardgame isLocal={isLocal} matchID={matchID} gameConfig={gameConfig} />
      </TabPanel>
    </>
  );
};

export default DevView;
