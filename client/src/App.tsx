import { Box } from '@chakra-ui/react';
import Boardgame from './BoardGame';
import './App.css';
import Header from './features/Header/Header';
import { useAppSelector } from './app/hooks'


function App() {
  const playerId = useAppSelector(state => state.header.playerId);

  return (
    <>
      <Header />
      <Box my="5">
        <Boardgame playerID={playerId} />
      </Box>
    </>
  );
}

export default App;
