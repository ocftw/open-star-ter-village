import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
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

const Boardgame: React.FC<{ isLocal: boolean} & React.ComponentProps<ReturnType<typeof Client>>> = ({ isLocal, ...props }) => {
  const multiplayer = isLocal ? Local() : SocketIO({ server: 'localhost:8000' });

  const BoardgameComponent = Client({
    game: OpenStarTerVillage,
    board: Board,
    multiplayer,
    // @ts-ignore
    enhancer: (window && window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()),
  })
  return <BoardgameComponent {...props} />;
}

export default Boardgame;
