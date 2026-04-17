const CACHE_NAME = 'photo-tool-v2';
const OFFLINE_ASSETS = [
  '/styles.css',
  '/shared.js',
  '/tool.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  ).then(() => self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Navigation requests: network only, no caching
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request));
    return;
  }

  // Images: network only, no offline support
  if (request.destination === 'image') {
    event.respondWith(fetch(request));
    return;
  }

  // Other assets: cache first, then network
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        if (request.method === 'GET' && request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
