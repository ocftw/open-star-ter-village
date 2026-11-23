/**
 * Graceful shutdown (DB-C6): stop taking connections, let per-match queues
 * finish the moves they are processing, then finish in-flight and pending
 * latest-state writes, all inside one deadline below Fly's kill_timeout.
 */
export async function shutdownGracefully(steps: {
  stopAccepting: () => Promise<void>;
  waitForMoves: () => Promise<void>;
  flushWrites: () => Promise<boolean>;
  timeoutMs?: number;
}): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), steps.timeoutMs ?? 4_000);
  });
  try {
    const finished = await Promise.race([
      (async () => {
        await steps.stopAccepting();
        await steps.waitForMoves();
        return steps.flushWrites();
      })(),
      deadline,
    ]);
    if (finished) console.info('Match writes finished; shutting down');
    else console.warn('Shutdown finished with unsaved match state');
    return finished;
  } catch {
    console.warn('Shutdown failed while finishing match writes');
    return false;
  } finally {
    clearTimeout(timer);
  }
}
