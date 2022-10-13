import { useCallback } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

export interface IActiveJobProps {
  job: Type.Card.Job;
  jobIndex: number;
  onClick: (e: { job: IActiveJobProps['job'], jobIndex: IActiveJobProps['jobIndex'] }) => void;
  selected?: boolean;
}

const ActiveJob: React.FC<IActiveJobProps> = (props) => {
  const { job, jobIndex, onClick, selected } = props;
  const boarderColor = selected ? "red.300" : "gray.100";
  const handleClick = useCallback(() => {
    onClick({ job, jobIndex });
  }, [job, jobIndex, onClick])

  return (
    <Box m="4" p="4" border="1px" borderRadius="lg" borderColor={boarderColor} onClick={handleClick}>
      <Text fontSize='sm'>{job.name}</Text>
    </Box>
  );
}

export default ActiveJob;
