import { Box } from '@chakra-ui/react';
import Boardgame from './BoardGame';
import './App.css';
import Header from './features/Header/Header';
import { useState } from 'react';


function App() {
  const [playerId, setPlayerId] = useState<string | undefined>();

  return (
    <>
      <Header playerId={playerId} onPlayerIdChange={setPlayerId} />
      <Box my="5">
        <Boardgame playerID={playerId} />
      </Box>
    </>
  );
}

export default App;
