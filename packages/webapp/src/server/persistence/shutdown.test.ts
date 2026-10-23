import { drainOnShutdown } from './shutdown';

describe('shutdown drain', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { jest.restoreAllMocks(); });

  it('stops intake before draining and waits for the final save', async () => {
    let releaseSave!: () => void;
    const finalSave = new Promise<void>(resolve => { releaseSave = resolve; });
    let intakeStopped = false;
    let exited = false;
    const flush = jest.fn(async () => { expect(intakeStopped).toBe(true); await finalSave; });
    const pending = drainOnShutdown(async () => { intakeStopped = true; }, {
      flush, pendingMatchIDs: () => ['member-match'],
    }).then(value => { exited = true; return value; });
    await new Promise(resolve => setImmediate(resolve));
    expect(flush).toHaveBeenCalledTimes(1);
    expect(exited).toBe(false);
    releaseSave();
    expect(await pending).toBe(true);
    expect(console.info).toHaveBeenCalledWith('Match save drain complete');
  });

  it('logs every unsaved match ID on timeout', async () => {
    expect(await drainOnShutdown(async () => {}, {
      flush: () => new Promise(() => {}), pendingMatchIDs: () => ['first', 'second'],
    }, 10)).toBe(false);
    expect(console.warn).toHaveBeenCalledWith('Match save drain timed out', {
      unsavedMatchIDs: ['first', 'second'],
    });
  });

  it('also bounds a stuck stop operation and never begins a new flush afterward', async () => {
    const flush = jest.fn(async () => {});
    let releaseStop!: () => void;
    const stopped = new Promise<void>(resolve => { releaseStop = resolve; });
    expect(await drainOnShutdown(() => stopped, {
      flush, pendingMatchIDs: () => ['still-pending'],
    }, 10)).toBe(false);
    releaseStop();
    await new Promise(resolve => setImmediate(resolve));
    expect(flush).not.toHaveBeenCalled();
  });

  it('shuts down a memory-only server and sanitizes failures', async () => {
    expect(await drainOnShutdown(async () => {})).toBe(true);
    expect(await drainOnShutdown(async () => { throw new Error('secret-connection-url'); })).toBe(false);
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('secret-connection-url');
  });
});
