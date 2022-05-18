import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Stack } from '@chakra-ui/react';
import ActiveProject from '../Project/ActiveProject';

type Props = BoardProps<Type.State.Root>;

const Table: React.FC<Props> = (props) => {
  return (
    <Box>
      <Stack direction={['column', 'column', 'row']} wrap="wrap" mt={2} spacing={0}>
        {props.G.table.activeProjects.map((p) => (
          <Box key={p.card.name} w={['100%', '100%', '50%', '50%', '33.3%']}>
            <ActiveProject project={p} />
          </Box>
        ))}
      </Stack >
    </Box >
  )
}

export default Table;
