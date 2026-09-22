'use client';

import { useEffect } from 'react';
import { trackLinkClick } from '@/lib/analytics';

export default function LinkClickTracker() {
  useEffect(() => {
    const handleLinkActivation = (event: MouseEvent) => {
      if (event.button !== 0 && event.button !== 1) return;

      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;
      if (link) trackLinkClick(link);
    };

    document.addEventListener('click', handleLinkActivation);
    document.addEventListener('auxclick', handleLinkActivation);
    return () => {
      document.removeEventListener('click', handleLinkActivation);
      document.removeEventListener('auxclick', handleLinkActivation);
    };
  }, []);

  return null;
}
