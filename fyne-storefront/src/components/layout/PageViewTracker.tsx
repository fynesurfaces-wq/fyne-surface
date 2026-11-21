'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Sends a tiny page-view beacon to the backend so the Admin dashboard can show
 * Sessions, Conversion rate and Live visitors. Anonymous: a random session id
 * kept in sessionStorage, no cookies, no personal data.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      let sid = sessionStorage.getItem('fyne_sid');
      if (!sid) {
        sid = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9_-]/g, '');
        sessionStorage.setItem('fyne_sid', sid);
      }
      const w = window.innerWidth;
      const body = JSON.stringify({
        sessionId: sid,
        path: pathname,
        referrer: document.referrer ? document.referrer.slice(0, 300) : undefined,
        utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        device: w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop',
      });
      const url = '/api/v1/store/analytics/track';
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      else fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    } catch {
      /* analytics must never break the page */
    }
  }, [pathname]);

  return null;
}
