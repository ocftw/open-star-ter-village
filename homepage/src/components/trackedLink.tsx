import React, {
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trackPromotion } from '../lib/service/gtm';

type Promotion = {
  creativeName: string;
  creativeSlot: string;
};

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  analyticsId: string;
  href: string;
  // Defaults to the promotion's creative slot, else the global link_click
  // tracker infers it from the surrounding landmark.
  placement?: string;
  // Present only for links measured as GA4 promotions: adds view_promotion on
  // the first 50%-visible impression and select_promotion on click.
  promotion?: Promotion;
  children?: ReactNode;
};

const TrackedLink: React.FC<TrackedLinkProps> = ({
  analyticsId,
  href,
  placement,
  promotion,
  children,
  ...linkProps
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const impressionSent = useRef(false);
  const { locale } = useRouter();
  const creativeName = promotion?.creativeName;
  const creativeSlot = promotion?.creativeSlot;

  const sendPromotionEvent = useCallback(
    (event: 'view_promotion' | 'select_promotion') => {
      if (!creativeName || !creativeSlot) return;
      trackPromotion({
        event,
        promotionId: analyticsId,
        promotionName: 'Online Game',
        creativeName,
        creativeSlot,
        destinationUrl: href,
        locale,
      });
    },
    [analyticsId, creativeName, creativeSlot, href, locale],
  );

  useEffect(() => {
    const element = linkRef.current;
    if (
      !creativeName ||
      !element ||
      typeof IntersectionObserver === 'undefined'
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!impressionSent.current) {
            impressionSent.current = true;
            sendPromotionEvent('view_promotion');
          }
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [creativeName, sendPromotionEvent]);

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={() => sendPromotionEvent('select_promotion')}
      data-analytics-id={analyticsId}
      data-analytics-placement={placement ?? creativeSlot}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

export default TrackedLink;
