import { Project } from '@/game/table/table';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';

type Props = {
  project?: Project;
};

const ActiveProject: React.FC<Props> = ({ project }) => {
  const projectName = project?.card.name;
  const headRow = (
    <TableRow>
      <TableCell>玩家</TableCell>
      <TableCell>職業</TableCell>
      <TableCell>貢獻</TableCell>
      <TableCell>進度</TableCell>
    </TableRow>
  );

  const workerRows = project?.contributions.map(worker =>
    <TableRow key={`job-${worker.jobName}-${worker.worker}`}>
      <TableCell>{worker.worker}</TableCell>
      <TableCell>{worker.jobName}</TableCell>
      <TableCell>{worker.value}</TableCell>
      <TableCell>{project.card.requirements[worker.jobName]}</TableCell>
    </TableRow>
  )

  return (
    <Box m={2} p={2} border={1} borderRadius="borderRadius" borderColor="grey.300">
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="h6">{projectName}</Typography>
              </TableCell>
            </TableRow>
            {headRow}
          </TableHead>
          <TableBody>
            {workerRows}
          </TableBody>
          <TableHead>
            {headRow}
          </TableHead>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ActiveProject;
