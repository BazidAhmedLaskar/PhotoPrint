const CACHE_NAME = 'photo-tool-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/tool.html',
  '/contact.html',
  '/updates.html',
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
  if (event.request.destination === 'image') {
    event.respondWith(
      fetch(event.request).catch(() => null)
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return null;
      });
    })
  );
});
