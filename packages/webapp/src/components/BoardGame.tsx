import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game, { GameState } from '@/game';
import Table from '@/components/Table/Table';
import DevActions from '@/components/DevActions/DevActions';
import ActionBoard from './ActionBoard/ActionBoard';
import GameHeader from './GameHeader/GameHeader';

const Board: React.FC<BoardProps<GameState>> = (props) => {
  const { G, debug } = props;
  return (
    <div className='Board'>
      <GameHeader players={G.players} scoreBoard={G.table.scoreBoard}  />
      <ActionBoard />
      <Table table={G.table} />
      {debug && <DevActions {...props} />}
    </div>
  );
}

type OwnProps = {
  isLocal: boolean;
}

type Props = OwnProps & React.ComponentProps<ReturnType<typeof Client>>;

const Boardgame: React.FC<Props> = ({ isLocal, ...props }) => {
  const multiplayer = isLocal ? Local() : SocketIO({ server: 'localhost:8000' });

  const BoardgameComponent = Client({
    game,
    board: Board,
    multiplayer,
    numPlayers: 3,
  })
  return <BoardgameComponent {...props} />;
}

export default Boardgame;
