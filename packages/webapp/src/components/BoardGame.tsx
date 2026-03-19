import { Client } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import React from 'react';
import { Game } from 'boardgame.io';
import { GameState } from '@/game';
import Table from '@/components/Table/Table';
import ActionBar from './ActionBoard/ActionBar/ActionBar';
import GameHeader from './GameHeader/GameHeader';
import UserPanel from './UserPanel/UserPanel';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from '@mui/material';
import { GameContext } from './GameContextHelpers';
import ActionStepper from './ActionBoard/ActionStepper/ActionStepper';
import DiscardJobCardsPanel from './DiscardJobCards/DiscardJobCardsPanel';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx } = gameContext;
  const isMyTurn = playerID === ctx.currentPlayer;
  const gameover = ctx.gameover as { winners: string[] } | undefined;

  const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
  const hasPendingDiscard = G.table.fourFreedomsPendingDiscards.length > 0;
  const outOfAP = playerID != null && (G.players[playerID]?.token?.actions ?? 1) === 0;
  // Show the discard panel instead of the action bar when it's the last player's turn and
  // they need to remove 2 job cards (四大自由), either because AP is exhausted or they have
  // explicitly signalled they are done with their action phase (actionPhaseDone).
  const showDiscardPanel = isMyTurn && isLastPlayer && hasPendingDiscard &&
    (outOfAP || G.table.actionPhaseDone);

  return (
    <Box sx={{ display: 'flex' }}>
      {!!playerID && <UserPanel gameContext={gameContext} />}
      <Box sx={{ flex: 1, padding: '16px', marginLeft: { xs: 0 } }}>
        <GameHeader players={G.players} scoreBoard={G.table.scoreBoard} />
        {isMyTurn
          ? showDiscardPanel
            ? <DiscardJobCardsPanel gameContext={gameContext} />
            : <><ActionBar gameContext={gameContext} /><ActionStepper gameContext={gameContext} /></>
          : !!playerID && (
            <Alert severity="info" sx={{ mt: 1 }} data-testid="waiting-for-player-alert">
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
                {gameover.winners.length > 1
                  ? `Tie: Players ${gameover.winners.join(', ')}`
                  : `Winner: Player ${gameover.winners[0]}`}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>Final Scores:</Typography>
              <List dense>
                {Object.entries(ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard))
                  .sort(([, a], [, b]) => b - a)
                  .map(([playerId, points]) => (
                    <ListItem key={playerId} sx={gameover.winners.includes(playerId) ? { fontWeight: 'bold', bgcolor: 'action.selected', borderRadius: 1 } : {}}>
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
  /** Optional game config override. Must be a stable reference — all instances sharing
   *  a matchID should pass the SAME object so boardgame.io's LocalMaster is shared. */
  gameConfig?: Game<GameState>;
}

type Props = OwnProps & React.ComponentProps<ReturnType<typeof Client>>;

const Boardgame: React.FC<Props> = ({ isLocal, gameConfig, ...props }) => {
  // Memoize so Client() is called once per mount, not every render.
  // Creating a new class from Client() on every render causes React to see a new component
  // type, unmounting and remounting — which resets the game state.
  const BoardgameComponent = React.useMemo(() => {
    const multiplayer = isLocal ? Local() : SocketIO({ server: 'localhost:3001' });
    return Client({ game: gameConfig ?? game, board: Board, multiplayer, numPlayers: 3, debug: false });
  }, [isLocal, gameConfig]);

  return <BoardgameComponent {...props} />;
}

export default Boardgame;
