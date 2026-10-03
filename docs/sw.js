// Generated from the actual release contents.
const CACHE = 'jardin-additions-a867450ecf133d01';
const SCOPE = new URL(self.registration.scope);
const ASSETS = ["./","./assets/index-BMOIyAkL.js","./assets/index-BzaJtJpm.js","./assets/index-CI44mpLS.js","./assets/index-D5U4yK32.css","./assets/index-DHOuN1DD.js","./assets/index-DT1W2C8k.css","./assets/index-DppXRFHT.css","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./icons/maskable-512.png","./index.html","./manifest.webmanifest"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jardin-additions-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) return response;
      } catch { /* Fall back to the complete installed release without a network. */ }
      return (await cache.match('./index.html')) || Response.error();
    }
    // These same-origin static files have identical content for every request.
    // A development server's Vary: Origin must not hide a precached module offline.
    return (await cache.match(event.request, { ignoreVary: true })) || fetch(event.request);
  }));
});
