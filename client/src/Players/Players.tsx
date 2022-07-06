import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType } from 'packages/game/src/types';
import { HStack, List, ListItem, Heading, Stack } from '@chakra-ui/react';

const Players: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G } = props;

  const players = Object.keys(G.players).map(player => (
    <HStack key={player} my="3">
      <Heading as="h3" size="md">Player {player}</Heading>
      <List ml="5">
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
    </HStack>
  ));

  return (
    <>
      <Heading as="h2" size="lg">Players</Heading>
      <Stack direction={['column', 'row']} mt={2}>
        {players}
      </Stack>
    </>
  );
}

export default Players;
