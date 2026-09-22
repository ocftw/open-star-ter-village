/**
 * @jest-environment jsdom
 */

describe('analytics', () => {
  const originalGtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

  beforeEach(() => {
    jest.resetModules();
    delete window.dataLayer;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID = originalGtmId;
  });

  it('does nothing when the GTM ID is absent', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
    const { trackAnalyticsEvent } = await import('./analytics');

    trackAnalyticsEvent('game_intent', { entry_path: '/lobby' });

    expect(window.dataLayer).toBeUndefined();
  });

  it('pushes named events and parameters when analytics is enabled', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID = 'GTM-TEST';
    const { trackAnalyticsEvent } = await import('./analytics');

    trackAnalyticsEvent('game_intent', { entry_path: '/lobby' });

    expect(window.dataLayer).toEqual([
      { event: 'game_intent', entry_path: '/lobby' },
    ]);
  });
});
