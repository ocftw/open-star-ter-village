import { useCallback, useEffect } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Heading, ButtonGroup, Button } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import ActionBoardSlice from './actionBoardSlice';

const ActionBoard: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const dispatch = useAppDispatch();
  const playerID = props.playerID;
  const currentPlayer = props.ctx.currentPlayer;
  const currentMove = useAppSelector(state =>
    state.actionBoard.moves.length
      ? state.actionBoard.moves[state.actionBoard.moves.length - 1]
      : null
  );
  const isCreateProjectMoveActive = currentMove?.move === 'createProject';

  useEffect(() => {
    if (playerID === currentPlayer) {
      dispatch(ActionBoardSlice.actions.playerTurnInited(currentPlayer));
    }
  }, [playerID, currentPlayer, dispatch]);

  const handleCreateProjectButtonClick = useCallback(() => {
    if (isCreateProjectMoveActive) {
      return;
    }

    dispatch(ActionBoardSlice.actions.moveInited({ moveType: 'createProject' }));
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
