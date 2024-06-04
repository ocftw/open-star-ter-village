import { BoardProps } from 'boardgame.io/react';
import { Box, Grid } from '@mui/material';
import ActiveProject from '../Project/ActiveProject';

type Props = BoardProps<OpenStarTerVillageType.State.Root>;

const Table: React.FC<Props> = (props) => {
  const activeProjects = [...props.G.table.activeProjects, ...Array(6)].slice(0, 6);

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
