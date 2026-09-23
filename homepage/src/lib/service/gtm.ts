import { buildLinkClickPayload } from '@open-star-ter-village/link-analytics';

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

export const trackLinkClick = (link: HTMLAnchorElement, locale?: string) => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  pushToDataLayer({
    event: 'link_click',
    ...buildLinkClickPayload(link, locale),
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
