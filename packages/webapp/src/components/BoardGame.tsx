import { Client } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import Table from '@/components/Table/Table';
import DevActions from '@/components/DevActions/DevActions';
import ActionBar from './ActionBoard/ActionBar';
import GameHeader from './GameHeader/GameHeader';
import UserPanel from './UserPanel/UserPanel';
import { Box } from '@mui/material';
import { GameContext } from './GameContextHelpers';

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, debug, playerID } = gameContext;

  return (
    <Box sx={{ display: 'flex' }}>
      {!!playerID &&
        <UserPanel gameContext={gameContext}/>
      }
      <Box sx={{ flex: 1, padding: '16px', marginLeft: { xs: 0 } }}>
        <GameHeader players={G.players} scoreBoard={G.table.scoreBoard}  />
        <ActionBar gameContext={gameContext} />
        <Table table={G.table} />
        {debug && <DevActions {...gameContext} />}
      </Box>
    </Box>
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
