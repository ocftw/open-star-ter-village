import * as React from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Heading, ButtonGroup, Button } from '@chakra-ui/react'

const ActionBoard: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const playerID = props.playerID;
  const currentPlayer = props.ctx.currentPlayer;

  return (
    <>
      <Box m="4" p="4" border="1px" borderRadius="lg" borderColor="gray.100">
        <Heading size="xs">Current Player: {currentPlayer}</Heading>
      </Box>
      <Box m="4" p="4" border="1px" borderRadius="lg" borderColor="gray.100">
        {playerID === currentPlayer && (
          <ButtonGroup size='sm' spacing='6'>
            <Button>Create Project</Button>
            <Button disabled>Move 2</Button>
            <Button disabled>Move 3</Button>
          </ButtonGroup>
        )}
      </Box>
    </>
  );
};

export default ActionBoard;
