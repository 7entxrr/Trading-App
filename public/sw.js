/* GoldMiner Control - service worker.
 *
 * Scope is deliberately narrow: cache the app shell so the PWA opens instantly
 * and survives a flaky mobile connection. Trading data is NEVER cached — a
 * stale balance or a stale "EA ONLINE" badge is worse than no data at all.
 */

const CACHE_NAME = 'goldminer-shell-v1';
const SHELL_ASSETS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always hit the network for trading data.
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network first, cached shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((cached) => cached || Response.error())),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || network;
    }),
  );
});

/* Web Push. The backend is not issuing pushes yet; this handler is the
 * receiving end the future push service will talk to. */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'GoldMiner', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'GoldMiner', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag,
      data: { url: payload.url || '/alerts' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/alerts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => 'focus' in client);
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    }),
  );
});
