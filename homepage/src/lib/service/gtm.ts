export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

const ONLINE_GAME_ITEM = {
  item_id: 'online_game',
  item_name: 'Open StarTer Village Online Game',
};

export const isAnalyticsEnabled = () => Boolean(GTM_ID);

export const pushToDataLayer = (payload: Record<string, unknown>) => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

const getLinkPlacement = (link: HTMLAnchorElement) => {
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
};

const getViewportBucket = () => {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1200) return 'tablet';
  return 'desktop';
};

export const trackLinkClick = (link: HTMLAnchorElement, locale?: string) => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  const url = new URL(link.href, window.location.href);
  const isWebUrl = ['http:', 'https:'].includes(url.protocol);
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
      ? url.origin === window.location.origin
        ? 'internal:untagged'
        : `external:${url.hostname}`
      : `protocol:${url.protocol.replace(':', '')}`);

  pushToDataLayer({
    event: 'link_click',
    link_id: linkId,
    link_url: safeUrl,
    link_domain: isWebUrl ? url.hostname : undefined,
    link_text: link.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
    link_placement: getLinkPlacement(link),
    link_target: link.target || '_self',
    is_external: isWebUrl && url.origin !== window.location.origin,
    locale,
    source_path: window.location.pathname,
    viewport_bucket: getViewportBucket(),
  });
};

export const trackPromotion = ({
  event,
  promotionId,
  promotionName,
  creativeName,
  creativeSlot,
  destinationUrl,
  locale,
}: {
  event: 'view_promotion' | 'select_promotion';
  promotionId: string;
  promotionName: string;
  creativeName: string;
  creativeSlot: string;
  destinationUrl: string;
  locale?: string;
}) => {
  if (!isAnalyticsEnabled()) return;

  pushToDataLayer({ ecommerce: null });
  pushToDataLayer({
    event,
    destination_url: destinationUrl,
    locale,
    ecommerce: {
      creative_name: creativeName,
      creative_slot: creativeSlot,
      promotion_id: promotionId,
      promotion_name: promotionName,
      items: [
        {
          ...ONLINE_GAME_ITEM,
          creative_name: creativeName,
          creative_slot: creativeSlot,
          promotion_id: promotionId,
          promotion_name: promotionName,
        },
      ],
    },
  });
};
