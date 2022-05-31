import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Tfoot,
} from '@chakra-ui/react';

type Props = {};

const ActiveProject: React.FC<Props> = () => {
  return (
    <Box m="4" px="4" border="1px" borderRadius="lg" borderColor="gray.100">
      <TableContainer overflowX="hidden" overflowY="hidden">
        <Table size="sm">
          <TableCaption placement="top" h="9"></TableCaption>
          <Thead>
            <Tr h="6">
              <Th w="30%">玩家</Th>
              <Th w="30%">職業</Th>
              <Th w="20%">貢獻</Th>
              <Th w="20%">進度</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Array(6).fill(0).map((_, slotIndex) => {
              return (
                <Tr key={`slot-${slotIndex}`} h="9">
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                </Tr>
              )
            })}
          </Tbody>
          <Tfoot>
            <Tr h="6">
              <Th w="30%">玩家</Th>
              <Th w="30%">職業</Th>
              <Th w="20%">貢獻</Th>
              <Th w="20%">進度</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ActiveProject;
