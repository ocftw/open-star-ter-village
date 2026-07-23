/**
 * Run async tasks exclusively per key: tasks sharing a key execute strictly
 * in submission order, while distinct keys stay parallel. Used to serialize
 * boardgame.io's playAgain endpoint per original match ID — its
 * read-check-create-write on metadata.nextMatchID is not atomic, so two
 * concurrent rematch requests could otherwise create separate rooms.
 * In-process only, which matches the single-machine game server.
 */
export interface KeyedTaskQueue {
  runExclusive<T>(key: string, task: () => Promise<T>): Promise<T>;
  /** Number of keys with queued or running work (test observability). */
  size(): number;
}

export function createKeyedTaskQueue(): KeyedTaskQueue {
  const tails = new Map<string, Promise<void>>();

  return {
    runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
      const tail = tails.get(key) ?? Promise.resolve();
      // Run after the predecessor settles, whether it resolved or rejected.
      const run = tail.then(task, task);
      const settled = run.then(
        () => undefined,
        () => undefined,
      );
      tails.set(key, settled);
      void settled.then(() => {
        // Drop the chain once no follower has been queued behind us.
        if (tails.get(key) === settled) {
          tails.delete(key);
        }
      });
      return run;
    },
    size: () => tails.size,
  };
}
