import { List, ListItem, Typography, Stack } from '@mui/material';
import { PlayersState } from '@/game';

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
