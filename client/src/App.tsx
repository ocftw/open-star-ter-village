import logo from './logo.svg';
import './App.css';
import Boardgame from './BoardGame';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          OpenStarTerVillage
        </p>
        <a
          className="App-link"
          href="https://github.com/ocftw/open-star-ter-village"
          target="_blank"
          rel="noopener noreferrer"
        >
          Clone from github
        </a>
      </header>
      <h1>player 0 view</h1>
      <Boardgame playerID="0" />
      <h1>player 1 view</h1>
      <Boardgame playerID="1" />
      <h1>observer view</h1>
      <Boardgame />
    </div>
  );
}

export default App;
