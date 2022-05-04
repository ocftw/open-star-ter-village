import { Heading, Flex, Box, Text, Link, Image } from '@chakra-ui/react';
import Boardgame from './BoardGame';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <>
      <Flex bg="blue.900" flexDirection="row" alignItems="center" justifyContent="center">
        <Image src={logo} alt="logo" boxSize="62px" className="App-logo" />
        <Box as="p" py="4">
          <Text color="white" fontSize="xl">OpenStarTerVillage</Text>
        </Box>
        <Box as="p" py="4" pl="2">
          <Link
            color="cyan.300"
            href="https://github.com/ocftw/open-star-ter-village"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clone from github
          </Link>
        </Box>
      </Flex>
      <Box ml="10" mt="5">
        <Heading as="h1" size="xl">Player 0 view</Heading>
        <Boardgame playerID="0" />
      </Box>
      <Box ml="10" mt="5">
        <Heading as="h1" size="xl">Player 1 view</Heading>
        <Boardgame playerID="1" />
      </Box>
      <Box ml="10" mt="5">
        <Heading as="h1" size="xl">Observer view</Heading>
        <Boardgame />
      </Box>
    </>
  );
}

export default App;
