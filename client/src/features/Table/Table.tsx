import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Stack } from '@chakra-ui/react';
import ActiveProject from '../Project/ActiveProject';
import ProjectPlaceholder from '../Project/ProjectPlaceholder';

type Props = BoardProps<Type.State.Root>;

const Table: React.FC<Props> = (props) => {
  const activeProjects = props.G.table.activeProjects;
  const projectPlaceholderCount = 6 - activeProjects.length;

  return (
    <Box>
      <Stack direction={['column', 'column', 'row']} wrap="wrap" mt={2} spacing={0}>
        {activeProjects.map((p) => (
          <Box key={p.card.name} w={['100%', '100%', '50%', '50%', '33.3%']}>
            <ActiveProject project={p} />
          </Box>
        ))}
        {Array(projectPlaceholderCount).fill(0).map((_, index) => (
          <Box key={`project-placeholder-${index}`} w={['100%', '100%', '50%', '50%', '33.3%']}>
            <ProjectPlaceholder />
          </Box>
        ))}
      </Stack >
    </Box >
  )
}

export default Table;
