import { HStack, Box, Text, Link, Image, Button, ButtonGroup } from '@chakra-ui/react';
import logo from './logo.svg';
import { useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { setPlayerId } from './headerSlice';

const BOARDS = [
  { id: 'overview', playerId: undefined, title: 'Overview' },
  { id: '0', playerId: '0', title: 'Player 0' },
  { id: '1', playerId: '1', title: 'Player 1' },
];

interface IHeaderProps {
}

const Header: React.FunctionComponent<IHeaderProps> = () => {
  const playerId = useAppSelector((state) => state.header.playerId);
  const dispatch = useAppDispatch();

  const currentBoard = useMemo(() => {
    return BOARDS.find(b => b.playerId === playerId);
  }, [playerId]);

  const handleBoardButtonClick: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    const playerId = e.currentTarget.getAttribute('data-player-id') || undefined;
    dispatch(setPlayerId(playerId));
  }, [dispatch]);

  return (
    <HStack bg="blue.900" align="center">
      <Image src={logo} alt="logo" boxSize="62px" className="App-logo" />
      <Box py="4">
        <Text color="white" fontSize="xl">OpenStarTerVillage</Text>
      </Box>
      <Box py="4" pl="2">
        <Link
          color="cyan.300"
          href="https://github.com/ocftw/open-star-ter-village"
          target="_blank"
          rel="noopener noreferrer"
        >
          Clone from github
        </Link>
      </Box>
      <Box py="4" pl="2">
        <ButtonGroup size="xs">
          {BOARDS.map((board => (
            <Button
              key={board.id}
              data-player-id={board.playerId}
              isActive={board === currentBoard}
              onClick={handleBoardButtonClick}
            >
              {board.title}
            </Button>
          )))}
        </ButtonGroup>
      </Box>
    </HStack>
  );
};

export default Header;
