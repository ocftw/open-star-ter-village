import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game, { GameState } from '@/game';
import Table from '@/components/Table/Table';
import DevActions from '@/components/DevActions/DevActions';
import ActionBoard from './ActionBoard/ActionBoard';
import GameHeader from './GameHeader/GameHeader';
import { playerNameMap } from './playerNameMap';
import { PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import UserPanel from './UserPanel/UserPanel';
import { Box } from '@mui/material';

const Board: React.FC<BoardProps<GameState>> = (props) => {
  const { G, debug, playerID } = props;

  return (
    <Box sx={{ display: 'flex' }}>
      {!!playerID &&
        <UserPanel
          userName={playerNameMap[playerID]}
          actionTokens={PlayersSelector.getNumActionTokens(G.players, playerID)}
          workerTokens={PlayersSelector.getNumWorkerTokens(G.players, playerID)}
          score={ScoreBoardSelector.getPlayerPoints(G.table.scoreBoard, playerID)}
          projectCards={PlayersSelector.getProjectCards(G.players, playerID)}
        />
      }
      <Box sx={{ flex: 1, padding: '16px', marginLeft: { xs: 0 } }}>
        <GameHeader players={G.players} scoreBoard={G.table.scoreBoard}  />
        <ActionBoard />
        <Table table={G.table} />
        {debug && <DevActions {...props} />}
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
