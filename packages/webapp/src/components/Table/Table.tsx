import { Box, Grid } from '@mui/material';
import ActiveProject from '../Project/ActiveProject';
import { Table as TableState } from '@/game/store/slice/table';

interface Props {
  table: TableState;
}

const Table: React.FC<Props> = (props) => {
  const maxActiveProjects = 6;
  const activeProjects = [...props.table.activeProjects, ...Array(maxActiveProjects)].slice(0, maxActiveProjects);

  return (
    <Box>
      <Grid container spacing={2}>
        {activeProjects.map((p, pIndex) => (
          <Grid item xs={12} sm={6} md={4} key={`active-project-${pIndex}`}>
            <ActiveProject project={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Table;
