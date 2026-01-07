// Service Worker para la aplicación de limpieza
// Bump the cache name to force browsers to fetch the latest assets. When this
// value changes, the service worker will install a new cache and ignore the
// old one. Without this change, browsers could continue serving outdated
// resources such as index.html and script.js, preventing new features from
// appearing.
const CACHE_NAME = 'limpieza-app-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/portal.html',
  '/script.js',
  '/manifest.json',
  '/banner.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devuelve la respuesta en caché o realiza la solicitud en la red
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpieza de caches antiguos si existieran
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
});