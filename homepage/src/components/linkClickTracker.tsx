import { useEffect } from 'react';
import { trackLinkClick } from '../lib/service/gtm';

const LinkClickTracker = ({ locale }: { locale?: string }) => {
  useEffect(() => {
    const handleLinkActivation = (event: MouseEvent) => {
      if (event.button !== 0 && event.button !== 1) return;

      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : undefined;
      if (link) trackLinkClick(link, locale);
    };

    document.addEventListener('click', handleLinkActivation);
    document.addEventListener('auxclick', handleLinkActivation);
    return () => {
      document.removeEventListener('click', handleLinkActivation);
      document.removeEventListener('auxclick', handleLinkActivation);
    };
  }, [locale]);

  return null;
};

export default LinkClickTracker;
