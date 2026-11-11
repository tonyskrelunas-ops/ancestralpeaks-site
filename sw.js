/* Ancestral Peaks, the installable app: pages come fresh from the network when there is one and from the
   phone when there isn't; images, previews and the free sessions are kept on the phone after the first play. */
const VERSION = 'peaks-app-2026-11-10k';
const SHELL = ['/', '/listen/', '/reading/', '/manifest.webmanifest', '/app/icon-192.png', '/app/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.headers.has('range')) return;                     // let the browser stream audio and video itself
  const isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('/'))));
    return;
  }
  if (/\.(?:css|js)$/i.test(url.pathname)) {                 // styles and scripts: always the newest from the network, the phone's copy only offline
    e.respondWith(fetch(req).then(r => { if (r.ok && r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (/\.(?:jpg|jpeg|png|webp|svg|woff2|mp3)$/i.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok && r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
