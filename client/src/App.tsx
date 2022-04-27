import AppHeader from './features/AppHeader/AppHeader';
import Boardgame from './BoardGame';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <AppHeader />
      <div className={styles.context}>
        <h1 className={styles.heading}>player 0 view</h1>
        <Boardgame playerID="0" />
      </div>
      <div className={styles.context}>
        <h1 className={styles.heading}>player 1 view</h1>
        <Boardgame playerID="1" />
      </div>
      <div className={styles.context}>
        <h1 className={styles.heading}>observer view</h1>
        <Boardgame />
      </div>
    </div>
  );
}

export default App;
