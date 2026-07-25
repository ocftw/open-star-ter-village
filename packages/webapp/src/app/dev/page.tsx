import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import DevGameHost from '@/components/dev/DevGameHost';
import {
  parseDevConfig,
  type SearchParamValue,
} from '@/components/dev/devConfig';

function getFirstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function DevPage({
  searchParams,
}: {
  searchParams?: {
    demo?: SearchParamValue;
    mode?: SearchParamValue;
    seed?: SearchParamValue;
    user?: SearchParamValue;
  };
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const result = parseDevConfig({
    user: searchParams?.user,
    mode: searchParams?.mode,
  });

  if (!result.ok) {
    return (
      <main
        role="alert"
        style={{
          maxWidth: 720,
          margin: '48px auto',
          padding: 24,
          border: '2px solid var(--ink)',
          borderRadius: 16,
          background: 'white',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Invalid developer configuration</h1>
        <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>{result.error}</p>
      </main>
    );
  }

  return (
    <DevGameHost
      initialMatchID={`dev-${randomUUID()}`}
      initialPerspective={result.config.perspective}
      initialTransport={result.config.transport}
      demo={getFirstValue(searchParams?.demo)}
      seed={getFirstValue(searchParams?.seed)}
    />
  );
}
