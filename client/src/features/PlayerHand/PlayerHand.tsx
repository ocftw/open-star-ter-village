import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { Box, Heading, HStack, Table, TableCaption, TableContainer, Tbody, Td, Tfoot, Th, Thead, Tr } from '@chakra-ui/react';

const PlayerHand: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID } = props;

  const headRow = (
    <Tr h="6">
      <Th w="60%">職業</Th>
      <Th w="40%">貢獻</Th>
    </Tr>
  );

  const requirementRows = (requirements: Record<string, number>) => {
    return Object.entries(requirements).map(([jobName, contribution]) => {
      return (
        <Tr h="9">
          <Td>{jobName}</Td>
          <Td>{contribution}</Td>
        </Tr>
      )
    })
  };

  const renderHandProjectCards = () => (
    <HStack w={['100%', '100%', '20%']}>
      {
        playerID && G.players[playerID].hand.projects.map((project, index) =>
          <Box m="4" px="4" border="1px" borderRadius="lg" borderColor="gray.100">
            <TableContainer overflowX="hidden" overflowY="hidden">
              <Table size="sm">
                <TableCaption placement="top" h="9">{project.name}</TableCaption>
                <Thead>
                  {headRow}
                </Thead>
                <Tbody>
                  {requirementRows(project.requirements)}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>)
      }
    </HStack>
  );

  return (
    <>
      <Heading as="h2" size="lg">Player Hand</Heading>
      <Heading as="h3" size="md">Project Cards</Heading>
      {renderHandProjectCards()}
    </>
  );
}

export default PlayerHand;
