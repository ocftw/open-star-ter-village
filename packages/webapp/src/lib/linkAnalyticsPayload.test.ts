/**
 * @jest-environment jsdom
 */
import { buildLinkClickPayload } from '@open-star-ter-village/link-analytics';

// jsdom reports a 1024px viewport, which is the tablet bucket.
describe('shared link_click payload', () => {
  it('produces the documented field set for a tagged external link', () => {
    const main = document.createElement('main');
    const link = document.createElement('a');
    link.href = 'https://example.com/cards?token=secret#featured';
    link.dataset.analyticsId = 'featured_cards';
    link.textContent = '  Featured   cards  ';
    main.append(link);
    document.body.append(main);

    expect(buildLinkClickPayload(link, 'zh-Hant')).toEqual({
      link_id: 'featured_cards',
      link_url: 'https://example.com/cards#featured',
      link_domain: 'example.com',
      link_text: 'Featured cards',
      link_placement: 'main',
      link_target: '_self',
      is_external: true,
      locale: 'zh-Hant',
      source_path: '/',
      viewport_bucket: 'tablet',
    });
  });

  it('buckets untagged links and strips non-web urls', () => {
    const internal = document.createElement('a');
    internal.href = '/game/abc123';
    const mail = document.createElement('a');
    mail.href = 'mailto:hi@ocf.tw';
    document.body.append(internal, mail);

    expect(buildLinkClickPayload(internal).link_id).toBe('internal:untagged');
    expect(buildLinkClickPayload(mail)).toMatchObject({
      link_id: 'protocol:mailto',
      link_url: 'mailto:',
      link_domain: undefined,
      is_external: false,
    });
  });
});
