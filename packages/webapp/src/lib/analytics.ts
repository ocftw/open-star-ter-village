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

export function trackProjectCatalogInterest(
  linkPlacement: 'header' | 'game_over',
): void {
  trackAnalyticsEvent('project_catalog_interest', {
    link_placement: linkPlacement,
    destination_url: 'https://openstartervillage.ocf.tw/cards',
    source_path: window.location.pathname,
  });
}
