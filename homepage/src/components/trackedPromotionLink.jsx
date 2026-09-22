import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trackPromotion } from '../lib/service/gtm';

const TrackedPromotionLink = ({
  analyticsId,
  creativeName,
  creativeSlot,
  href,
  children,
  ...linkProps
}) => {
  const linkRef = useRef(null);
  const impressionSent = useRef(false);
  const { locale } = useRouter();

  const sendPromotionEvent = useCallback(
    (event) => {
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
      {...linkProps}
    >
      {children}
    </Link>
  );
};

export default TrackedPromotionLink;
