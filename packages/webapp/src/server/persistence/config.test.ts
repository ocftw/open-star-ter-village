import { persistenceConfig } from './config';

it.each([{}, { MATCH_PERSISTENCE: 'member' }, { MATCH_PERSISTENCE: 'off', DATABASE_URL: 'must-not-connect' }])
('accepts disabled persistence configuration for %j', env => {
  expect(persistenceConfig(env)).toEqual({ resumeWindowHours: 24 });
});

it('defaults to member persistence with a database URL and a 24-hour window', () => {
  expect(persistenceConfig({ DATABASE_URL: 'postgres://test' })).toEqual({
    resumeWindowHours: 24,
  });
});

it('accepts a configured resume window and rejects invalid settings without echoing them', () => {
  expect(persistenceConfig({ MATCH_RESUME_WINDOW_HOURS: '48' }).resumeWindowHours).toBe(48);
  for (const value of ['', '0', '-1', 'NaN', 'Infinity', 'bad-secret-value']) {
    expect(() => persistenceConfig({ MATCH_RESUME_WINDOW_HOURS: value })).toThrow('MATCH_RESUME_WINDOW_HOURS must be a positive number');
  }
  expect(() => persistenceConfig({ DATABASE_URL: 'secret-url', MATCH_PERSISTENCE: 'all' }))
    .toThrow('MATCH_PERSISTENCE must be member or off');
});
