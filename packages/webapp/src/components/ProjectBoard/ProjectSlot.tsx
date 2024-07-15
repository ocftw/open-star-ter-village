import { ProjectSlotState } from '@/game';
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
  slot: ProjectSlotState;
};

const ProjectSlot: React.FC<Props> = ({ slot }) => {
  const projectName = slot.card?.name;
  const headRow = (
    <TableRow>
      <TableCell>玩家</TableCell>
      <TableCell>職業</TableCell>
      <TableCell>貢獻</TableCell>
      <TableCell>進度</TableCell>
    </TableRow>
  );

  const workerRows = slot.contributions.map(worker =>
    <TableRow key={`job-${worker.jobName}-${worker.worker}`}>
      <TableCell>{worker.worker}</TableCell>
      <TableCell>{worker.jobName}</TableCell>
      <TableCell>{worker.value}</TableCell>
      <TableCell>{slot.card?.requirements[worker.jobName]}</TableCell>
    </TableRow>
  )

  return (
    <Box m={2} p={2} border={1} borderRadius="borderRadius" borderColor="grey.300">
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell colSpan={3}>
                <Typography variant="h6">{projectName}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">{slot.owner}</Typography>
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

export default ProjectSlot;
