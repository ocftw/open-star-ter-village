import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Stack, Box, UnorderedList, ListItem } from '@chakra-ui/react'

const PlayerBoard: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID } = props;

  if (playerID === null) {
    return null;
  }

  return (
    <>
      <Stack direction={['column', 'row']} mt={1}>
        <Box>Project Cards:</Box>
        <UnorderedList>
          {
            G.players[playerID].hand.projects.map((p, i) => (
              <ListItem key={`project-card-${i}`}>
                <span>title: {p.name}</span>
                <span>jobs: {JSON.stringify(p.jobs)}</span>
              </ListItem>))
          }
        </UnorderedList>
      </Stack>
      <Stack direction={['column', 'row']} mt={1}>
        <Box>Resource Cards:</Box>
        <UnorderedList>
          {
            G.players[playerID].hand.resources.map((r, i) => (
              <ListItem key={`resource-card-${i}`}>
                <span>{r.name}</span>
              </ListItem>))
          }
        </UnorderedList>
      </Stack>
    </>
  )
};

export default PlayerBoard;
