import { Box, Grid } from '@mui/material';
import ProjectSlot from '@/components/ProjectBoard/ProjectSlot';
import { TableState } from '@/game';

interface Props {
  table: TableState;
}

const Table: React.FC<Props> = (props) => {
  return (
    <Box>
      <Grid container spacing={2}>
        {props.table.projectBoard.map((p, pIndex) => (
          <Grid item xs={12} sm={6} md={4} key={`active-project-${pIndex}`}>
            <ProjectSlot slot={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Table;
