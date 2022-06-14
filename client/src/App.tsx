import { HStack, Box, Text, Link, Image, Button, ButtonGroup } from '@chakra-ui/react';
import Boardgame from './BoardGame';
import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

const BOARDS = [
  { id: 'overview', playerId: undefined, title: 'Overview' },
  { id: '0', playerId: '0', title: 'Player 0' },
  { id: '1', playerId: '1', title: 'Player 1' },
];


function App() {
  const [currentBoard, setCurrentBoard] = useState(BOARDS[1]);

  return (
    <>
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
                isActive={board === currentBoard}
                onClick={() => setCurrentBoard(board)}
              >
                {board.title}
              </Button>
            )))}
          </ButtonGroup>
        </Box>
      </HStack>
      <Box my="5">
        <Boardgame playerID={currentBoard.playerId} />
      </Box>
    </>
  );
}

export default App;
