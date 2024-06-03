'use client';

import { Box, Typography } from '@mui/material';
import Boardgame from '@/components/BoardGame';

function DevView() {
  return (
    <>
      <Box ml={2} mt={2}>
        <Typography variant="h4">Player 0 view</Typography>
        <Boardgame playerID="0" />
      </Box>
      <Box ml={2} mt={2}>
        <Typography variant="h4">Player 1 view</Typography>
        <Boardgame playerID="1" />
      </Box>
      <Box ml={2} mt={2}>
        <Typography variant="h4">Observer view</Typography>
        <Boardgame />
      </Box>
    </>
  );
}

export default DevView;
