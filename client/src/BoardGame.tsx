import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';
import Table from './features/Table/Table';
import ActionBoard from './features/ActionBoard/ActionBoard';
import Players from './Players/Players';
import DevActions from './DevActions/DevActions';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  return (
    <div className='Board'>
      <ActionBoard {...props} />
      <Table {...props} />
      <Players {...props} />
      <DevActions {...props} />
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
