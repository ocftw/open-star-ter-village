import { Client } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import Table from '@/components/Table/Table';
import ActionBar from './ActionBoard/ActionBar/ActionBar';
import GameHeader from './GameHeader/GameHeader';
import UserPanel from './UserPanel/UserPanel';
import { Box } from '@mui/material';
import { GameContext } from './GameContextHelpers';
import ActionStepper from './ActionBoard/ActionStepper/ActionStepper';

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx } = gameContext;

  return (
    <Box sx={{ display: 'flex' }}>
      {!!playerID && <UserPanel gameContext={gameContext} />}
      <Box sx={{ flex: 1, padding: '16px', marginLeft: { xs: 0 } }}>
        <GameHeader players={G.players} scoreBoard={G.table.scoreBoard} />
        {playerID === ctx.currentPlayer && <><ActionBar gameContext={gameContext} /><ActionStepper gameContext={gameContext} /></>}
        <Box sx={{ marginTop: '16px' }}>
          <Table table={G.table} playerID={playerID} />
        </Box>
      </Box>
    </Box>
  );
};

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
