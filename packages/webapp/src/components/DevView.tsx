'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Boardgame from '@/components/BoardGame';
import { playerNameMap } from './playerNameMap';
import TabPanel from './TabPanel';

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const DevView: React.FC<{ isLocal: boolean }> = ({ isLocal }) => {
  const [value, setValue] = useState(0);

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
        <Boardgame isLocal={isLocal} matchID="dev" playerID="0" />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Boardgame isLocal={isLocal} matchID="dev" playerID="1" />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Boardgame isLocal={isLocal} matchID="dev" playerID="2" />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Boardgame isLocal={isLocal} matchID="dev" />
      </TabPanel>
    </>
  );
};

export default DevView;
