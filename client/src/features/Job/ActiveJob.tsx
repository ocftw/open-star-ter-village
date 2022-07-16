import { Box, Text } from '@chakra-ui/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

export interface IActiveJobProps {
  job: Type.Card.Job;
}

const ActiveJob: React.FC<IActiveJobProps> = (props) => {
  const { job } = props;

  return (
    <Box m="4" p="4" border="1px" borderRadius="lg" borderColor="gray.100">
      <Text fontSize='sm'>{job.name}</Text>
    </Box>
  );
}

export default ActiveJob;
