import { BoardProps } from 'boardgame.io/react';
import { List, ListItem, Typography, Stack } from '@mui/material';

const Players: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G } = props;

  const players = Object.keys(G.players).map(player => (
    <Stack direction="row" spacing={2} my={2} key={player}>
      <Typography variant="h6">Player {player}</Typography>
      <List sx={{ ml: 2 }}>
        <ListItem>
          WorkerTokens: {G.players[player].token.workers}
        </ListItem>
        <ListItem>
          ActionTokens: {G.players[player].token.actions}
        </ListItem>
        <ListItem>
          CompletedProjects: {JSON.stringify(G.players[player].completed.projects)}
        </ListItem>
      </List>
    </Stack>
  ));

  return (
    <>
      <Typography variant='h6'>Players</Typography>
      <Stack direction={['column', 'row']} mt={2}>
        {players}
      </Stack>
    </>
  );
}

export default Players;
