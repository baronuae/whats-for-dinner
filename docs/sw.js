// Offline support for "What's for Dinner". Bump VERSION when the app changes.
const VERSION = 'wfd-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Save all 40 photo sheets in the background so photos also show offline.
  caches.open(VERSION).then(c => { for (let i = 0; i < 40; i++) { const u = './ph/s' + i + '.jpg'; c.match(u).then(h => h || c.add(u).catch(() => {})); } });
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // WhatsApp, YouTube etc. go straight to the network
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    // Page: try the network first so updates arrive, fall back to the saved copy offline.
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Photos, icons and fonts: use the saved copy, fetch and save it the first time.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
