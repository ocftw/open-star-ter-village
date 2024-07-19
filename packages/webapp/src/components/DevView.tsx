'use client';

import { Box, Typography } from '@mui/material';
import Boardgame from '@/components/BoardGame';
import { playerNameMap } from './playerNameMap';

function DevView({ isLocal }: { isLocal: boolean }) {
  return (
    <>
      <Box ml={2} mt={2}>
        <Typography variant="h4">{playerNameMap["0"]} view</Typography>
        <Boardgame isLocal={isLocal} matchID="dev" playerID="0" />
      </Box>
      <Box ml={2} mt={2}>
        <Typography variant="h4">{playerNameMap["1"]} view</Typography>
        <Boardgame isLocal={isLocal} matchID="dev" playerID="1" />
      </Box>
      <Box ml={2} mt={2}>
        <Typography variant="h4">{playerNameMap["2"]} view</Typography>
        <Boardgame isLocal={isLocal} matchID="dev" playerID="2" />
      </Box>
      <Box ml={2} mt={2}>
        <Typography variant="h4">Observer view</Typography>
        <Boardgame isLocal={isLocal} matchID="dev" />
      </Box>
    </>
  );
}

export default DevView;
