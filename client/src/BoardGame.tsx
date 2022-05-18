import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';
import Table from './features/Table/Table';
import Players from './Players/Players';
import CurrentPlayer from './CurrentPlayer/CurrentPlayer';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  return (
    <div className='Board'>
      <Players {...props} />
      <CurrentPlayer {...props} />
      <Table {...props} />
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
