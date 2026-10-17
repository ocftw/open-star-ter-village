export interface PendingSaves {
  flush(): Promise<void>;
  pendingMatchIDs(): string[];
}

/** Include stopping intake in the deadline: a stuck connection must not eat the drain budget. */
export async function drainOnShutdown(
  stopAccepting: () => Promise<void>,
  saves?: PendingSaves,
  timeoutMs = 10000,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    const drained = await Promise.race([
      (async () => {
        await stopAccepting();
        if (timedOut) return false;
        await saves?.flush();
        return true;
      })(),
      new Promise<false>(resolve => { timer = setTimeout(() => { timedOut = true; resolve(false); }, timeoutMs); }),
    ]);
    if (drained) {
      console.info('Match save drain complete');
    } else {
      console.warn('Match save drain timed out', { unsavedMatchIDs: saves?.pendingMatchIDs() ?? [] });
    }
    return drained;
  } catch {
    console.warn('Match save drain failed', { unsavedMatchIDs: saves?.pendingMatchIDs() ?? [] });
    return false;
  } finally {
    clearTimeout(timer);
  }
}
