export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

export type AnalyticsEventParameters = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(GTM_ID);
}

export function trackAnalyticsEvent(
  event: string,
  parameters: AnalyticsEventParameters = {},
): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...parameters });
}

function getLinkPlacement(link: HTMLAnchorElement): string {
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

function getViewportBucket(): 'mobile' | 'tablet' | 'desktop' {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1200) return 'tablet';
  return 'desktop';
}

export function trackLinkClick(link: HTMLAnchorElement): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  const url = new URL(link.href, window.location.href);
  const isWebUrl = ['http:', 'https:'].includes(url.protocol);
  const safeUrl = isWebUrl
    ? `${url.origin}${url.pathname}${url.hash}`
    : `${url.protocol}`;
  const linkId =
    link.dataset.analyticsId ||
    link.id ||
    (isWebUrl
      ? `${url.origin === window.location.origin ? 'internal' : 'external'}:${
          url.origin === window.location.origin ? '' : url.hostname
        }${url.pathname}${url.hash}`
      : `protocol:${url.protocol.replace(':', '')}`);

  trackAnalyticsEvent('link_click', {
    link_id: linkId,
    link_url: safeUrl,
    link_domain: isWebUrl ? url.hostname : undefined,
    link_text: link.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
    link_placement: getLinkPlacement(link),
    link_target: link.target || '_self',
    is_external: isWebUrl && url.origin !== window.location.origin,
    locale: document.documentElement.lang,
    source_path: window.location.pathname,
    viewport_bucket: getViewportBucket(),
  });
}

export function trackProjectCatalogInterest(
  linkPlacement: 'header' | 'game_over',
): void {
  trackAnalyticsEvent('project_catalog_interest', {
    link_placement: linkPlacement,
    destination_url: 'https://openstartervillage.ocf.tw/cards',
    source_path: window.location.pathname,
  });
}
