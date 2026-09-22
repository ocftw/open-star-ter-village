'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default function GameIntentTracker() {
  useEffect(() => {
    trackAnalyticsEvent('game_intent', { entry_path: '/lobby' });
  }, []);

  return null;
}
