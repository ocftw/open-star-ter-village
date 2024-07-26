import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

type PlayerStatusProps = {
  name: string;
  workerTokens: number;
  actionTokens: number;
  score: number;
};

const PlayerStatus: React.FC<PlayerStatusProps> = ({ name, workerTokens, actionTokens, score }) => {
  return (
    <Grid container direction="row" alignItems="center" spacing={1}>
      <Grid item>
        <Typography variant="body2" style={{ marginRight: '8px' }}>{name}</Typography>
      </Grid>
      <Grid item>
        <Typography variant="body2" style={{ marginRight: '8px' }}>Workers: {workerTokens}</Typography>
      </Grid>
      <Grid item>
        <Typography variant="body2" style={{ marginRight: '8px' }}>Actions: {actionTokens}</Typography>
      </Grid>
      <Grid item>
        <Typography variant="body2">Score: {score}</Typography>
      </Grid>
    </Grid>
  );
};

export default PlayerStatus;
