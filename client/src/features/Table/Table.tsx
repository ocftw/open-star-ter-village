import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Stack } from '@chakra-ui/react';
import ActiveProject from '../Project/ActiveProject';
import ActiveJob from '../Job/ActiveJob';

type Props = BoardProps<Type.State.Root>;

const Table: React.FC<Props> = (props) => {
  const activeProjects = [...props.G.table.activeProjects, ...Array(6)].slice(0, 6);
  const activeJobs = props.G.table.activeJobs;

  return (
    <Box>
      <Stack direction={['column', 'column', 'row']} wrap="wrap" mt={2} spacing={0}>
        <Box w={['100%', '100%', '80%']}>
          <Stack direction={['column', 'column', 'row']} wrap="wrap" mt={2} spacing={0}>
            {activeProjects.map((p, pIndex) => (
              <Box key={`active-project-${pIndex}`} w={['100%', '100%', '100%', '50%', '50%']}>
                <ActiveProject project={p} />
              </Box>
            ))}
          </Stack>
        </Box>
        <Box w={['100%', '100%', '20%']}>
          <Stack direction={['column', 'column', 'row']} wrap="wrap" mt={2} spacing={0}>
            {activeJobs.map((job, jobIndex) => (
              <Box key={`active-job-${jobIndex}`} w={['100%', '100%', '100%', '100%', '50%']}>
                <ActiveJob job={job} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default Table;
