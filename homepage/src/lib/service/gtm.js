export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

const ONLINE_GAME_ITEM = {
  item_id: 'online_game',
  item_name: 'Open StarTer Village Online Game',
};

export const isAnalyticsEnabled = () => Boolean(GTM_ID);

export const pushToDataLayer = (payload) => {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

export const trackPromotion = ({
  event,
  promotionId,
  promotionName,
  creativeName,
  creativeSlot,
  destinationUrl,
  locale,
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
