type DevRouteEnv = Partial<Record<'NODE_ENV' | 'ENABLE_DEV_ROUTE', string>>;

/**
 * `/dev` is always available outside production. Production builds keep it
 * disabled unless the image was built with `ENABLE_DEV_ROUTE=true`, which only
 * the per-PR staging workflow sets.
 */
export function isDevRouteEnabled(env: DevRouteEnv = process.env): boolean {
  return env.NODE_ENV !== 'production' || env.ENABLE_DEV_ROUTE === 'true';
}
