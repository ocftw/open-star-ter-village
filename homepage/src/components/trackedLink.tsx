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

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  analyticsId: string;
  creativeName: string;
  creativeSlot: string;
  href: string;
  children?: ReactNode;
};

const TrackedLink: React.FC<TrackedLinkProps> = ({
  analyticsId,
  creativeName,
  creativeSlot,
  href,
  children,
  ...linkProps
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const impressionSent = useRef(false);
  const { locale } = useRouter();

  const sendPromotionEvent = useCallback(
    (event: 'view_promotion' | 'select_promotion') => {
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
    if (!element || typeof IntersectionObserver === 'undefined') return;

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
  }, [sendPromotionEvent]);

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={() => sendPromotionEvent('select_promotion')}
      data-analytics-id={analyticsId}
      data-analytics-placement={creativeSlot}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

export default TrackedLink;
