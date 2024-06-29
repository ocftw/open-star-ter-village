import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import { OpenStarTerVillage } from '@/game';
import Table from '@/components/Table/Table';
import Players from '@/components/Players/Players';
import DevActions from '@/components/DevActions/DevActions';
import ActionBoard from './ActionBoard/ActionBoard';
import { GameState } from '@/game/game';

const Board: React.FC<BoardProps<GameState>> = (props) => {
  const { G, ctx, debug } = props;
  return (
    <div className='Board'>
      <ActionBoard />
      <Table table={G.table} />
      <Players players={G.players} />
      {debug && <DevActions {...props} />}
    </div>
  );
}

const Boardgame: React.FC<{ isLocal: boolean} & React.ComponentProps<ReturnType<typeof Client>>> = ({ isLocal, ...props }) => {
  const multiplayer = isLocal ? Local() : SocketIO({ server: 'localhost:8000' });

  const BoardgameComponent = Client({
    game: OpenStarTerVillage,
    board: Board,
    multiplayer,
  })
  return <BoardgameComponent {...props} />;
}

export default Boardgame;
