const CACHE = 'contas-do-mes-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './version.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.endsWith('version.json')) { e.respondWith(fetch(e.request)); return; }
  const isPage = e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/');

  if (isPage) {
    // Network-first: always try to get the latest app first; cache is only the offline fallback.
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first, refreshed in the background.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

