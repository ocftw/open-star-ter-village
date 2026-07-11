import DevView from '@/components/DevView';
import { Container, Typography } from '@mui/material';

type SearchParamValue = string | string[] | undefined;

function getSearchParamValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Developer harness (offline multi-view board), moved off the redesigned
 * homepage. Same gating as before: always on outside production, or with
 * ?dev=true in production.
 */
export default function DevPage({
  searchParams,
}: {
  searchParams?: { demo?: SearchParamValue; dev?: SearchParamValue; seed?: SearchParamValue };
}) {
  const demo = getSearchParamValue(searchParams?.demo);
  const dev = getSearchParamValue(searchParams?.dev);
  const seed = getSearchParamValue(searchParams?.seed);
  const showDevView = process.env.NODE_ENV !== 'production' || dev === 'true';

  if (!showDevView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">
          Developer View is disabled in production. Append ?dev=true to enable it.
        </Typography>
      </Container>
    );
  }

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Developer View
        </Typography>
        <DevView demo={demo} seed={seed} initialMode="offline" isDev={showDevView} />
      </Container>
    </main>
  );
}
