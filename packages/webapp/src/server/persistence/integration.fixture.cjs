// Test-only child process. It exposes control through fork IPC, never HTTP.
const simultaneousGame = {
  name: 'PersistenceProbe', setup: () => ({ applied: [] }),
  turn: { activePlayers: { all: 'simultaneous' }, stages: { simultaneous: { moves: {
    act: { move: ({ G, playerID }) => { G.applied.push(playerID); }, ignoreStaleStateID: true, client: false },
  } } } },
};
module.exports = { simultaneousGame };

if (require.main === module) {
  const Sentry = require('@sentry/node');
  const reports = [];
  Sentry.init({
    dsn: 'https://0123456789abcdef@example.invalid/1', defaultIntegrations: false,
    transport: () => ({
      send: async envelope => { reports.push(envelope); return { statusCode: 200 }; },
      flush: async () => true,
    }),
  });
  const { serve } = require('../../server');
  serve(process.env.PERSISTENCE_TEST_GAME === 'probe' ? [simultaneousGame] : undefined).then(runtime => {
    process.on('message', async message => {
      try {
        if (message.type === 'hold-saves') {
          const pool = runtime.persistence.store.pool;
          const query = pool.query.bind(pool);
          pool.query = (sql, ...args) => sql.includes('insert into matches')
            ? new Promise(() => {}) : query(sql, ...args);
        }
        if (message.type === 'flush') await runtime.persistence.store.flush?.();
        if (message.type === 'reports') await Sentry.flush(2000);
        const payload = message.type === 'reports' ? reports : undefined;
        process.send({ id: message.id, payload });
      } catch { process.send({ id: message.id, error: 'fixture command failed' }); }
    });
    process.send({ type: 'ready' });
  }).catch(() => { console.error('Fixture startup failed'); process.exit(1); });
}
