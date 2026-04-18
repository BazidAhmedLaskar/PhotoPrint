/* ════════════════════════════════════════════
   SERVICE WORKER - Offline Support
════════════════════════════════════════════ */

const CACHE_NAME = 'photoprintpro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/tool.html',
  '/download.html',
  '/contact.html',
  '/updates.html',
  '/styles.css',
  '/shared.js',
  '/tool.js',
  '/manifest.json',
  '/512x512.png',
  '/256x256.png',
  '/128x128.png',
  '/1024x1024.png',
  '/AppIcon98x98@2x.png',
  '/GooglePlayStore.png',
];

/* ════════════════════════════════════════════
   INSTALL EVENT - Cache files
════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ════════════════════════════════════════════
   ACTIVATE EVENT - Clean old caches
════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ════════════════════════════════════════════
   FETCH EVENT - Serve from cache when offline
════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first for API endpoints
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images, HTML)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Fall back to cached version if available
          return caches.match(event.request);
        });
    })
  );
});

console.log('Service worker loaded');
