import { createKeyedTaskQueue } from './keyedTaskQueue';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe('createKeyedTaskQueue', () => {
  it('runs same-key tasks strictly in submission order', async () => {
    const queue = createKeyedTaskQueue();
    const log: string[] = [];
    const gate = deferred<void>();

    const first = queue.runExclusive('m1', async () => {
      log.push('first:start');
      await gate.promise;
      log.push('first:end');
    });
    const second = queue.runExclusive('m1', async () => {
      log.push('second:start');
    });

    // Second must not start while first is still running.
    await Promise.resolve();
    expect(log).toEqual(['first:start']);

    gate.resolve();
    await Promise.all([first, second]);
    expect(log).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('keeps distinct keys parallel', async () => {
    const queue = createKeyedTaskQueue();
    const log: string[] = [];
    const gate = deferred<void>();

    const blocked = queue.runExclusive('m1', async () => {
      await gate.promise;
      log.push('m1');
    });
    await queue.runExclusive('m2', async () => {
      log.push('m2');
    });

    // m2 finished while m1 was still blocked.
    expect(log).toEqual(['m2']);
    gate.resolve();
    await blocked;
  });

  it('a rejected task does not wedge the queue and rejects only its caller', async () => {
    const queue = createKeyedTaskQueue();
    await expect(queue.runExclusive('m1', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(queue.runExclusive('m1', async () => 'after')).resolves.toBe('after');
  });

  it('cleans up drained keys', async () => {
    const queue = createKeyedTaskQueue();
    await queue.runExclusive('m1', async () => undefined);
    // Cleanup runs on the microtask after settlement.
    await Promise.resolve();
    expect(queue.size()).toBe(0);
  });
});

describe('playAgain-style read-check-create-write under concurrency', () => {
  // Mirrors boardgame.io's endpoint shape: check metadata.nextMatchID, then
  // asynchronously create the next match, then write it back.
  const makeFakeEndpoint = (queue?: ReturnType<typeof createKeyedTaskQueue>) => {
    const metadata: { nextMatchID?: string } = {};
    let created = 0;
    const handler = async (): Promise<string> => {
      if (metadata.nextMatchID) return metadata.nextMatchID;
      await new Promise((r) => setTimeout(r, 1)); // CreateMatch latency window
      created += 1;
      metadata.nextMatchID = `room-${created}`;
      return metadata.nextMatchID;
    };
    return {
      call: () => (queue ? queue.runExclusive('original-match', handler) : handler()),
      createdCount: () => created,
    };
  };

  it('unserialized concurrent calls create separate rematch rooms (the bug)', async () => {
    const { call, createdCount } = makeFakeEndpoint();
    const ids = await Promise.all([call(), call()]);
    expect(createdCount()).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('serialized concurrent calls converge on one rematch room', async () => {
    const { call, createdCount } = makeFakeEndpoint(createKeyedTaskQueue());
    const ids = await Promise.all([call(), call(), call(), call()]);
    expect(createdCount()).toBe(1);
    expect(new Set(ids)).toEqual(new Set(['room-1']));
  });
});
