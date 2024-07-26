import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { ProjectCard } from '@/game';
import { GameContext, connectGameContext } from '../GameContextHelpers';
import { playerNameMap } from '../playerNameMap';
import { PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import HandProjectCard from './HandProjectCard';

type UserPanelProps = {
  userName: string;
  workerTokens: number;
  actionTokens: number;
  score: number;
  projectCards: ProjectCard[];
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100vh', // Full height
  overflowY: 'auto', // Scroll if content overflows
  width: '300px', // Fixed width
}));

const UserPanel: React.FC<UserPanelProps> = ({ userName, workerTokens, actionTokens, score, projectCards }) => {

  return (
    <StyledPaper>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">{userName}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Workers: {workerTokens}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Actions: {actionTokens}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Score: {score}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Project Cards</Typography>
        </Grid>
        <Grid container direction="column" spacing={2}>
          {projectCards.map((card) => (
            <HandProjectCard key={card.id} card={card} />
          ))}
        </Grid>
      </Grid>
    </StyledPaper>
  );
};

const mapGameContextToProps = ({ G, playerID }: GameContext): UserPanelProps => {
  // only player will see user panel
  playerID = playerID!;

  const userName = playerNameMap[playerID];
  const actionTokens = PlayersSelector.getNumActionTokens(G.players, playerID);
  const workerTokens=PlayersSelector.getNumWorkerTokens(G.players, playerID);
  const score=ScoreBoardSelector.getPlayerPoints(G.table.scoreBoard, playerID);
  const projectCards= PlayersSelector.getProjectCards(G.players, playerID);

  return {
    userName,
    workerTokens,
    actionTokens,
    score,
    projectCards,
  };
}

export default connectGameContext(mapGameContextToProps)(UserPanel);
