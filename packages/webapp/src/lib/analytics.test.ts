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

  it('tracks privacy-safe link details with stable placement data', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID = 'GTM-TEST';
    const { trackLinkClick } = await import('./analytics');
    const main = document.createElement('main');
    const link = document.createElement('a');
    link.href = 'https://example.com/cards?token=secret#featured';
    link.dataset.analyticsId = 'featured_cards';
    link.textContent = '  Featured   cards  ';
    main.append(link);
    document.body.append(main);

    trackLinkClick(link);

    expect(window.dataLayer).toEqual([
      expect.objectContaining({
        event: 'link_click',
        link_id: 'featured_cards',
        link_url: 'https://example.com/cards#featured',
        link_domain: 'example.com',
        link_text: 'Featured cards',
        link_placement: 'main',
        link_target: '_self',
        is_external: true,
      }),
    ]);
    expect(window.dataLayer?.[0]).not.toHaveProperty(
      'link_url',
      expect.stringContaining('secret'),
    );
  });
});
