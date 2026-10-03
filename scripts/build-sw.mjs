import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(dir, prefix = '') {
  const list = [];
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + f.name;
    if (f.isDirectory()) list.push(...await files(`${dir}/${f.name}`, `${path}/`));
    else if (!['sw.js', '.nojekyll'].includes(f.name)) list.push(path);
  }
  return list.sort();
}
const paths = await files('docs');
const hash = createHash('sha256');
for (const path of paths) hash.update(await readFile(`docs/${path}`));
const version = hash.digest('hex').slice(0, 16);
await writeFile('docs/.nojekyll', '');
await writeFile('docs/sw.js', `// Generated from the actual release contents.
const CACHE = 'jardin-additions-${version}';
const SCOPE = new URL(self.registration.scope);
const ASSETS = ${JSON.stringify(['./', ...paths.map(p => './' + p)])};
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
    return (await cache.match(event.request)) || fetch(event.request);
  }));
});
`);
console.log(`Offline release ${version}: ${paths.length} files cached.`);
