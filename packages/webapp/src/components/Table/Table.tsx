import { Alert, Grid, Typography } from '@mui/material';
import { TableState } from '@/game';
import ProjectBoard from './ProjectBoard/ProjectBoard';
import JobSlots from './JobBoard/JobSlots';
import { PlayerID } from 'boardgame.io';

interface Props {
  table: TableState;
  playerID: PlayerID | null;
}

const Table: React.FC<Props> = (props) => {
  const activeEvent = props.table.eventSlot;

  return (
    <Grid container spacing={2} sx={{ marginTop: '16px' }}>
      {activeEvent && (
        <Grid item xs={12}>
          <Alert severity="info" icon={false}>
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
              Event: {activeEvent.name}
            </Typography>
            {activeEvent.description}
          </Alert>
        </Grid>
      )}
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
