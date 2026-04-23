import DevView from "@/components/DevView";
import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

type SearchParamValue = string | string[] | undefined;

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function Home({
  searchParams,
}: {
  searchParams?: { demo?: SearchParamValue; mode?: SearchParamValue; dev?: SearchParamValue };
}) {
  const demo = getSearchParamValue(searchParams?.demo);
  const dev = getSearchParamValue(searchParams?.dev);
  const showDevView = process.env.NODE_ENV !== 'production' || dev === 'true';

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h2" component="h1" gutterBottom>
              Open StarTer Village
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720, mb: 3 }}>
              Create an online room for 3 to 6 players, share the invite link, and start the live board once every seat is filled.
            </Typography>
            <Button component={Link} href="/lobby" variant="contained" size="large">
              Play Online
            </Button>
          </Box>

          {showDevView && (
            <Box>
              <Typography variant="h4" component="h2" gutterBottom>
                Developer View
              </Typography>
              <DevView demo={demo} initialMode="offline" isDev={showDevView} />
            </Box>
          )}
        </Stack>
      </Container>
    </main>
  );
}
