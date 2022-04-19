import AppHeader from './features/AppHeader/AppHeader';
import Boardgame from './BoardGame';
import { AppContainer, H1 } from './App.styled';

function App() {
  return (
    <AppContainer>
      <AppHeader />
      <H1>player 0 view</H1>
      <Boardgame playerID="0" />
      <H1>player 1 view</H1>
      <Boardgame playerID="1" />
      <H1>observer view</H1>
      <Boardgame />
    </AppContainer>
  );
}

export default App;
