import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Tfoot,
} from '@chakra-ui/react';

type Props = {
  project?: Type.State.Project;
};

const ActiveProject: React.FC<Props> = ({ project }) => {
  const projectName = project?.card.name;
  const headRow = (
    <Tr h="6">
      <Th w="30%">玩家</Th>
      <Th w="30%">職業</Th>
      <Th w="20%">貢獻</Th>
      <Th w="20%">進度</Th>
    </Tr>
  );

  const workerRows = project?.contributions.map(worker =>
    <Tr key={`job-${worker.jobName}-${worker.worker}`} h="9">
      <Td>{worker.worker}</Td>
      <Td>{worker.jobName}</Td>
      <Td>{worker.value}</Td>
      <Td>{project.card.requirements[worker.jobName]}</Td>
    </Tr>
  )

  return (
    <Box m="4" px="4" border="1px" borderRadius="lg" borderColor="gray.100">
      <TableContainer overflowX="hidden" overflowY="hidden">
        <Table size="sm">
          <TableCaption placement="top" h="9">{projectName}</TableCaption>
          <Thead>
            {headRow}
          </Thead>
          <Tbody>
            {workerRows}
          </Tbody>
          <Tfoot>
            {headRow}
          </Tfoot>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ActiveProject;
