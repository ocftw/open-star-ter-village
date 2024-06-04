import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer'
import { OpenStarTerVillage } from '@/game';
import Table from '@/components/Table/Table';
import Players from '@/components/Players/Players';
import DevActions from '@/components/DevActions/DevActions';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  return (
    <div className='Board'>
      <Table {...props} />
      <Players {...props} />
      <DevActions {...props} />
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
});

export default Boardgame;
