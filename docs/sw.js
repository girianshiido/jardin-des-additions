// Generated from the actual release contents.
const CACHE = 'jardin-additions-eb82067b37e44dc4';
const SCOPE = new URL(self.registration.scope);
const ASSETS = ["./","./assets/index-BMOIyAkL.js","./assets/index-BzaJtJpm.js","./assets/index-CI44mpLS.js","./assets/index-Cs8wHQ5S.css","./assets/index-D5U4yK32.css","./assets/index-DHOuN1DD.js","./assets/index-DT1W2C8k.css","./assets/index-DUZbJHIv.js","./assets/index-DppXRFHT.css","./assets/index-Hjique41.js","./audio/1-0.mp3","./audio/1-1.mp3","./audio/1-10.mp3","./audio/1-2.mp3","./audio/1-3.mp3","./audio/1-4.mp3","./audio/1-5.mp3","./audio/1-6.mp3","./audio/1-7.mp3","./audio/1-8.mp3","./audio/1-9.mp3","./audio/10-0.mp3","./audio/10-1.mp3","./audio/10-10.mp3","./audio/10-2.mp3","./audio/10-3.mp3","./audio/10-4.mp3","./audio/10-5.mp3","./audio/10-6.mp3","./audio/10-7.mp3","./audio/10-8.mp3","./audio/10-9.mp3","./audio/2-0.mp3","./audio/2-1.mp3","./audio/2-10.mp3","./audio/2-2.mp3","./audio/2-3.mp3","./audio/2-4.mp3","./audio/2-5.mp3","./audio/2-6.mp3","./audio/2-7.mp3","./audio/2-8.mp3","./audio/2-9.mp3","./audio/3-0.mp3","./audio/3-1.mp3","./audio/3-10.mp3","./audio/3-2.mp3","./audio/3-3.mp3","./audio/3-4.mp3","./audio/3-5.mp3","./audio/3-6.mp3","./audio/3-7.mp3","./audio/3-8.mp3","./audio/3-9.mp3","./audio/4-0.mp3","./audio/4-1.mp3","./audio/4-10.mp3","./audio/4-2.mp3","./audio/4-3.mp3","./audio/4-4.mp3","./audio/4-5.mp3","./audio/4-6.mp3","./audio/4-7.mp3","./audio/4-8.mp3","./audio/4-9.mp3","./audio/5-0.mp3","./audio/5-1.mp3","./audio/5-10.mp3","./audio/5-2.mp3","./audio/5-3.mp3","./audio/5-4.mp3","./audio/5-5.mp3","./audio/5-6.mp3","./audio/5-7.mp3","./audio/5-8.mp3","./audio/5-9.mp3","./audio/6-0.mp3","./audio/6-1.mp3","./audio/6-10.mp3","./audio/6-2.mp3","./audio/6-3.mp3","./audio/6-4.mp3","./audio/6-5.mp3","./audio/6-6.mp3","./audio/6-7.mp3","./audio/6-8.mp3","./audio/6-9.mp3","./audio/7-0.mp3","./audio/7-1.mp3","./audio/7-10.mp3","./audio/7-2.mp3","./audio/7-3.mp3","./audio/7-4.mp3","./audio/7-5.mp3","./audio/7-6.mp3","./audio/7-7.mp3","./audio/7-8.mp3","./audio/7-9.mp3","./audio/8-0.mp3","./audio/8-1.mp3","./audio/8-10.mp3","./audio/8-2.mp3","./audio/8-3.mp3","./audio/8-4.mp3","./audio/8-5.mp3","./audio/8-6.mp3","./audio/8-7.mp3","./audio/8-8.mp3","./audio/8-9.mp3","./audio/9-0.mp3","./audio/9-1.mp3","./audio/9-10.mp3","./audio/9-2.mp3","./audio/9-3.mp3","./audio/9-4.mp3","./audio/9-5.mp3","./audio/9-6.mp3","./audio/9-7.mp3","./audio/9-8.mp3","./audio/9-9.mp3","./audio/CREDITS.txt","./audio/sources.json","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./icons/maskable-512.png","./index.html","./manifest.webmanifest"];
async function audioRange(response, range) {
  const bytes = await response.arrayBuffer();
  const length = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start, end;
  if (match && (match[1] || match[2])) {
    if (!match[1]) { start = Math.max(0, length - Number(match[2])); end = length - 1; }
    else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), length - 1) : length - 1; }
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= length || end < start) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${length}` } });
  }
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}
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
    const cached = await cache.match(event.request, { ignoreVary: true });
    const range = event.request.headers.get('Range');
    if (cached && range && url.pathname.endsWith('.mp3')) return audioRange(cached, range);
    return cached || fetch(event.request);
  }));
});
