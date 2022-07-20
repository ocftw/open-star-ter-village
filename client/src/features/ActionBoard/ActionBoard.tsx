import { useCallback, useEffect } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Heading, ButtonGroup, Button } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { playerTurnInited, moveInited } from './actionBoardSlice';
import { MoveStatus } from './ActionBoard.types';

const ActionBoard: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const dispatch = useAppDispatch();
  const playerID = props.playerID;
  const currentPlayer = props.ctx.currentPlayer;
  const createProjectMove = useAppSelector(state => state.actionBoard.moves.find(move => move.move === 'createProject'));
  const isCreateProjectMoveActive = createProjectMove?.status === MoveStatus.editing;

  useEffect(() => {
    if (playerID === currentPlayer) {
      dispatch(playerTurnInited(currentPlayer));
    }
  }, [playerID, currentPlayer, dispatch]);

  const handleCreateProjectButtonClick = useCallback(() => {
    if (isCreateProjectMoveActive) {
      return;
    }

    dispatch(moveInited({ moveType: 'createProject' }));
  }, [isCreateProjectMoveActive, dispatch]);

  return (
    <>
      <Box m="4" p="4" border="1px" borderRadius="lg" borderColor="gray.100">
        <Heading size="xs">Current Player: {currentPlayer}</Heading>
      </Box>
      <Box m="4" p="4" border="1px" borderRadius="lg" borderColor="gray.100">
        {playerID === currentPlayer && (
          <ButtonGroup size='sm' spacing='6'>
            <Button
              onClick={handleCreateProjectButtonClick}
              colorScheme={isCreateProjectMoveActive ? "red" : "gray"}
            >
              Create Project
            </Button>
            <Button disabled>Move 2</Button>
            <Button disabled>Move 3</Button>
          </ButtonGroup>
        )}
      </Box>
    </>
  );
};

export default ActionBoard;
