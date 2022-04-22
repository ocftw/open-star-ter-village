import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';
import Players from './Players/Players';
import CurrentPlayer from './CurrentPlayer/CurrentPlayer';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G } = props;
  // show game table
  const Table = (
    <div>
      <h2>Table</h2>
      {JSON.stringify(G.table)}
    </div>
  );

  return (
    <div className='Board'>
      <Players {...props} />
      <CurrentPlayer {...props} />
      {Table}
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
