import { Grid, Typography } from '@mui/material';
import { TableState } from '@/game';
import ProjectBoard from './ProjectBoard/ProjectBoard';
import JobSlots from './JobBoard/JobSlots';
import { PlayerID } from 'boardgame.io';

interface Props {
  table: TableState;
  playerID: PlayerID | null;
}

const Table: React.FC<Props> = (props) => {
  return (
    <Grid container spacing={2} sx={{ marginTop: '16px' }}>
      <Grid item xs={12}>
        <Typography variant="h6">Project Slots</Typography>
        <ProjectBoard slots={props.table.projectBoard} playerID={props.playerID} />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Job Slots</Typography>
        <JobSlots jobs={props.table.jobSlots} />
      </Grid>
    </Grid>
  );
};

export default Table;
