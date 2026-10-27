import { debugTelemetryHandler } from './debugTelemetry';
import { emptyTelemetry } from './game/standard/telemetry';

const context = (matchID: string) => ({ params: { matchID }, status: 200, body: undefined as unknown });

describe('debug telemetry endpoint', () => {
  test('returns the telemetry of a Standard match', async () => {
    const telemetry = emptyTelemetry();
    const db = { fetch: async () => ({ state: { G: { standard: { round: 3, telemetry } } } }) };
    const ctx = context('m1');
    await debugTelemetryHandler(db)(ctx);
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ matchID: 'm1', round: 3, telemetry });
  });

  test.each([
    ['an unknown match', {}],
    ['a Simplified match', { state: { G: {} } }],
    ['a match created before telemetry', { state: { G: { standard: { round: 1 } } } }],
  ])('returns 404 for %s', async (_, result) => {
    const ctx = context('m2');
    await debugTelemetryHandler({ fetch: () => result })(ctx);
    expect(ctx.status).toBe(404);
  });
});
