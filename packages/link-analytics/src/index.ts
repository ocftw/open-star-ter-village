/**
 * The `link_click` payload is one analytics contract shared by two deploy
 * units: the homepage on Netlify and the webapp on Fly. GA4 joins their events
 * into a single cross-domain journey, so a field that differs between them
 * silently splits that journey. Both apps build the payload here and keep only
 * their own dispatch and locale source.
 */

export type LinkClickPayload = {
  link_id: string;
  link_url: string;
  link_domain: string | undefined;
  link_text: string | undefined;
  link_placement: string;
  link_target: string;
  is_external: boolean;
  locale: string | undefined;
  source_path: string;
  viewport_bucket: ViewportBucket;
};

export type ViewportBucket = 'mobile' | 'tablet' | 'desktop';

export function getLinkPlacement(link: HTMLAnchorElement): string {
  const explicitPlacement = link.closest<HTMLElement>(
    '[data-analytics-placement]',
  )?.dataset.analyticsPlacement;
  if (explicitPlacement) return explicitPlacement;

  if (link.closest('[role="dialog"]')) return 'dialog';
  if (link.closest('header')) return 'header';
  if (link.closest('nav')) return 'navigation';
  if (link.closest('footer')) return 'footer';
  if (link.closest('main')) return 'main';
  return 'other';
}

export function getViewportBucket(): ViewportBucket {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1200) return 'tablet';
  return 'desktop';
}

export function buildLinkClickPayload(
  link: HTMLAnchorElement,
  locale?: string,
): LinkClickPayload {
  const url = new URL(link.href, window.location.href);
  const isWebUrl = ['http:', 'https:'].includes(url.protocol);
  const isExternal = isWebUrl && url.origin !== window.location.origin;
  const safeUrl = isWebUrl
    ? `${url.origin}${url.pathname}${url.hash}`
    : `${url.protocol}`;
  // GA4 collapses a high-cardinality dimension into "(other)", which would take
  // the deliberately tagged ids with it, so untagged links fall back to a
  // bucket rather than their own path. `link_url` still carries the full path.
  const linkId =
    link.dataset.analyticsId ||
    link.id ||
    (isWebUrl
      ? isExternal
        ? `external:${url.hostname}`
        : 'internal:untagged'
      : `protocol:${url.protocol.replace(':', '')}`);

  return {
    link_id: linkId,
    link_url: safeUrl,
    link_domain: isWebUrl ? url.hostname : undefined,
    link_text: link.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
    link_placement: getLinkPlacement(link),
    link_target: link.target || '_self',
    is_external: isExternal,
    locale,
    source_path: window.location.pathname,
    viewport_bucket: getViewportBucket(),
  };
}
