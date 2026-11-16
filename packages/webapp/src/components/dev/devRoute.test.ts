import { isDevRouteEnabled } from './devRoute';

describe('isDevRouteEnabled', () => {
  it('is disabled in production by default', () => {
    expect(isDevRouteEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('is enabled in production when ENABLE_DEV_ROUTE is true', () => {
    expect(isDevRouteEnabled({ NODE_ENV: 'production', ENABLE_DEV_ROUTE: 'true' })).toBe(true);
  });

  it.each(['', 'false', '1', 'TRUE', 'yes'])(
    'stays disabled in production when ENABLE_DEV_ROUTE is %p',
    (value) => {
      expect(isDevRouteEnabled({ NODE_ENV: 'production', ENABLE_DEV_ROUTE: value })).toBe(false);
    },
  );

  it.each(['development', 'test', undefined])('is enabled when NODE_ENV is %p', (nodeEnv) => {
    expect(isDevRouteEnabled({ NODE_ENV: nodeEnv })).toBe(true);
  });
});
