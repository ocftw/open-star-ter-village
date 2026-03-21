import React from 'react';
import Grid from '@mui/material/Grid';
import PlayerStatus from './PlayerStatus';
import { ScoreBoardState } from '@/game';
import { playerNameMap } from '../playerNameMap';
import { ClientPlayers, PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';

type GameHeaderProps = {
  players: ClientPlayers;
  scoreBoard: ScoreBoardState;
};

const GameHeader: React.FC<GameHeaderProps> = ({ players, scoreBoard }) => {
  return (
    <Grid container justifyContent="space-between" alignItems="center" spacing={1} sx={{ padding: '8px 16px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
      {Object.keys(players).map((id) => (
        <Grid item key={id}>
          <PlayerStatus
            name={playerNameMap[id]}
            workerTokens={PlayersSelector.getNumWorkerTokens(players, id)}
            actionTokens={PlayersSelector.getNumActionTokens(players, id)}
            score={ScoreBoardSelector.getPlayerPoints(scoreBoard, id)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default GameHeader;
