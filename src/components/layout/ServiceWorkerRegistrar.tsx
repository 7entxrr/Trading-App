'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker so the dashboard installs to the home
 * screen and opens standalone. Registration is skipped in development to keep
 * hot reload from fighting a cached shell.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A failed registration only costs offline support; the app still runs.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
