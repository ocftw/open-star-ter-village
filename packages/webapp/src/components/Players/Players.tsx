import { List, ListItem, Typography, Stack } from '@mui/material';
import { Players as PlayersState } from '@/game/store/slice/type';

interface Props {
  players: PlayersState;
}

const Players: React.FC<Props> = (props) => {
  const players = Object.keys(props.players).map(player => (
    <Stack direction="row" spacing={2} my={2} key={player}>
      <Typography variant="h6">Player {player}</Typography>
      <List sx={{ ml: 2 }}>
        <ListItem>
          WorkerTokens: {props.players[player].token.workers}
        </ListItem>
        <ListItem>
          ActionTokens: {props.players[player].token.actions}
        </ListItem>
        <ListItem>
          CompletedProjects: {JSON.stringify(props.players[player].completed.projects)}
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
