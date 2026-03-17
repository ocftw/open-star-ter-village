import { Client } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import Table from '@/components/Table/Table';
import ActionBar from './ActionBoard/ActionBar/ActionBar';
import GameHeader from './GameHeader/GameHeader';
import UserPanel from './UserPanel/UserPanel';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from '@mui/material';
import { GameContext } from './GameContextHelpers';
import ActionStepper from './ActionBoard/ActionStepper/ActionStepper';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx } = gameContext;
  const isMyTurn = playerID === ctx.currentPlayer;
  const gameover = ctx.gameover as { winner: string } | undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      {!!playerID && <UserPanel gameContext={gameContext} />}
      <Box sx={{ flex: 1, padding: '16px', marginLeft: { xs: 0 } }}>
        <GameHeader players={G.players} scoreBoard={G.table.scoreBoard} />
        {isMyTurn
          ? <><ActionBar gameContext={gameContext} /><ActionStepper gameContext={gameContext} /></>
          : !!playerID && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Waiting for Player {ctx.currentPlayer}…
            </Alert>
          )
        }
        <Box sx={{ marginTop: '16px' }}>
          <Table table={G.table} playerID={playerID} />
        </Box>
      </Box>

      <Dialog open={!!gameover} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>Game Over</DialogTitle>
        <DialogContent>
          {gameover && (
            <>
              <Typography variant="h6" align="center" gutterBottom>
                Winner: Player {gameover.winner}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>Final Scores:</Typography>
              <List dense>
                {Object.entries(ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard))
                  .sort(([, a], [, b]) => b - a)
                  .map(([playerId, points]) => (
                    <ListItem key={playerId} sx={playerId === gameover.winner ? { fontWeight: 'bold', bgcolor: 'action.selected', borderRadius: 1 } : {}}>
                      <ListItemText
                        primary={`Player ${playerId}`}
                        secondary={`${points} VP`}
                      />
                    </ListItem>
                  ))}
              </List>
            </>
          )}
        </DialogContent>
      </Dialog>
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
    debug: false,
  })
  return <BoardgameComponent {...props} />;
}

export default Boardgame;
