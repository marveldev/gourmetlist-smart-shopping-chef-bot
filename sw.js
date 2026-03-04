const CACHE_NAME = 'gourmetlist-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html',
  '/signin.html',
  '/signout.html',
  '/createAccount.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/scripts/ui.js',
  '/scripts/helpers.js',
  '/scripts/ai.js',
  '/register.js',
  '/firebase.js',
  '/logo.svg',
  '/manifest.json'
];

// Install Event: Cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event: Network first, fallback to cache for offline support
self.addEventListener('fetch', event => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
