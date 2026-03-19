import DevView from "@/components/DevView";
import StoreProvider from "./StoreProvider";

export default async function Home({ searchParams }: { searchParams: Promise<{ demo?: string; mode?: string }> }) {
  const { demo, mode } = await searchParams;
  return (
    <StoreProvider>
      <main>
        <DevView demo={demo} initialMode={mode === 'online' ? 'online' : 'offline'} isDev={process.env.NODE_ENV !== 'production'} />
      </main>
    </StoreProvider>
  );
}
