/* ════════════════════════════════════════════
   SERVICE WORKER - Offline Support with Auto-Update
════════════════════════════════════════════ */

// VERSION: Bump this number when you want to force update all cached pages
const CACHE_VERSION = 'v3';
const CACHE_NAME = `photoprintwala-${CACHE_VERSION}`;
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
   ACTIVATE EVENT - Clean old caches and notify clients
════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
  // Notify all clients that new version is available
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'CACHE_UPDATED',
        message: 'New version available! Refresh the page to get updates.'
      });
    });
  });
});

/* ════════════════════════════════════════════
   FETCH EVENT - Network-first for HTML, Cache-first for assets
════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Non-GET requests - always try network
  if (event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // NETWORK-FIRST for HTML pages (always get fresh content when online)
  const isHtmlRequest = event.request.url.endsWith('.html') || 
                        event.request.url.endsWith('/') ||
                        event.request.url.endsWith('/index.html') ||
                        event.request.url.endsWith('/tool.html') ||
                        event.request.url.endsWith('/download.html') ||
                        event.request.url.endsWith('/contact.html') ||
                        event.request.url.endsWith('/updates.html');

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          // Update cache with new version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cached version if offline
          return caches.match(event.request) || 
                 caches.match('/index.html');
        })
    );
    return;
  }

  // CACHE-FIRST for static assets (CSS, JS, images, manifest)
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
          return caches.match(event.request);
        });
    })
  );
});

console.log('Service worker loaded');
