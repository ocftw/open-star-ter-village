import { Box, Grid } from '@mui/material';
import { TableState } from '@/game';
import ProjectBoard from './ProjectBoard/ProjectBoard';
import JobSlots from './JobBoard/JobSlots';

interface Props {
  table: TableState;
}

const Table: React.FC<Props> = (props) => {
  return (
    <Box>
      <Grid container spacing={2}>
        <ProjectBoard slots={props.table.projectBoard} />
        <JobSlots jobs={props.table.jobSlots} />
      </Grid>
    </Box>
  )
}

export default Table;
