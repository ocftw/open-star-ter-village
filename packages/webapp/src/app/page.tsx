import DevView from "@/components/DevView";

const getIsLocal = async () => {
  'use server'
  // Production is not ready for remote multiplayer yet.
  return process.env.NODE_ENV === 'production';
}

export default async function Home() {
  const isLocal = await getIsLocal();
  return (
    <main>
      <DevView isLocal={isLocal} />
    </main>
  );
}
