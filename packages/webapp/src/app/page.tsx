import DevView from "@/components/DevView";
import StoreProvider from "./StoreProvider";

const getIsLocal = async () => {
  'use server'
  // Production is not ready for remote multiplayer yet.
  return process.env.NODE_ENV === 'production';
}

export default async function Home({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const isLocal = await getIsLocal();
  const { demo } = await searchParams;
  return (
    <StoreProvider>
      <main>
        <DevView isLocal={isLocal} demo={demo} />
      </main>
    </StoreProvider>
  );
}
