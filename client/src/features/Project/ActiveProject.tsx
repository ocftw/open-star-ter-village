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

type DenormalizeSlot = {
  slotId: number;
  jobName: string;
  jobContribution: number;
  jobThreshold: number;
  worker: string | null;
  workerContribution: number;
  workerThreshold: number;
};

const reduceProjectToDenormalizedSlots =
  (project: Type.State.Project): DenormalizeSlot[] =>
    project.contribution.bySlot.map((_, slotId) => ({
      slotId,
      jobName: project.card.jobs[slotId],
      jobContribution: project.contribution.byJob[project.card.jobs[slotId]],
      jobThreshold: project.card.thresholds[project.card.jobs[slotId]],
      worker: project.workers[slotId],
      workerContribution: project.contribution.bySlot[slotId],
      workerThreshold: Math.min(6, project.card.thresholds[project.card.jobs[slotId]]),
    }))

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
  let slotRows = null;

  if (project) {
    const denormalizedSlots = reduceProjectToDenormalizedSlots(project);
    const jobGroups = denormalizedSlots.reduce<Record<DenormalizeSlot['jobName'], DenormalizeSlot[]>>((acc, slot) => {
      acc[slot.jobName] = acc[slot.jobName] || [];
      acc[slot.jobName].push(slot);

      return acc;
    }, {});

    slotRows = Object.entries(jobGroups).map(([jobName, slots]) => {
      const contribution = project.contribution.byJob[jobName];
      const threshold = project.card.thresholds[jobName];

      return slots.map((slot, slotIndex) => (
        <Tr key={`slot-${slotIndex}`} h="9">
          <Td>{slot.worker}</Td>
          <Td>{jobName}</Td>
          <Td>{slot.workerContribution}/{slot.workerThreshold}</Td>
          {slotIndex === 0 && (
            <Td rowSpan={slots.length}>{contribution}/{threshold}</Td>
          )}
        </Tr>
      ))
    });
  } else {
    slotRows = Array(6).fill(0).map((_, slotIndex) => (
      <Tr key={`slot-${slotIndex}`} h="9">
        <Td></Td>
        <Td></Td>
        <Td></Td>
        <Td></Td>
      </Tr>
    ))
  }

  return (
    <Box m="4" px="4" border="1px" borderRadius="lg" borderColor="gray.100">
      <TableContainer overflowX="hidden" overflowY="hidden">
        <Table size="sm">
          <TableCaption placement="top" h="9">{projectName}</TableCaption>
          <Thead>
            {headRow}
          </Thead>
          <Tbody>
            {slotRows}
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
