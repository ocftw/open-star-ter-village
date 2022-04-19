import AppHeader from './features/AppHeader/AppHeader';
import Boardgame from './BoardGame';
import { AppContainer, H1 } from './App.styled';
import './App.css';

function App() {
  return (
    <AppContainer>
      <AppHeader />
      <div className='App-context'>
        <H1>player 0 view</H1>
        <Boardgame playerID="0" />
      </div>
      <div className='App-context'>
        <H1>player 1 view</H1>
        <Boardgame playerID="1" />
      </div>
      <div className='App-context'>
        <H1>observer view</H1>
        <Boardgame />
      </div>
    </AppContainer>
  );
}

export default App;
