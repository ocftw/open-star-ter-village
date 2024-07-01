import { Box, Grid } from '@mui/material';
import ProjectSlot from '@/components/ProjectBoard/ProjectSlot';
import { Table as TableState } from '@/game/store/slice/type';

interface Props {
  table: TableState;
}

const Table: React.FC<Props> = (props) => {
  const maxActiveProjects = 6;
  const activeProjects = [...props.table.projectBoard, ...Array(maxActiveProjects)].slice(0, maxActiveProjects);

  return (
    <Box>
      <Grid container spacing={2}>
        {activeProjects.map((p, pIndex) => (
          <Grid item xs={12} sm={6} md={4} key={`active-project-${pIndex}`}>
            <ProjectSlot project={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Table;
