/* Chemistry with Yusuf – offline support. Network first (so daily updates arrive), cache as fallback. */
const VERSION = 'cy9701-v2';
const CORE = ['./', 'index.html', 'sims.js', 'games.js', 'extras.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'data/elements.json', 'ptable.json', 'data/ch01.json', 'data/ch02.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;                     // YouTube etc. go straight to the network
  if (font) {                                     // fonts: cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return res })));
    return;
  }
  const net = fetch(req).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)) } return res });
  const fallback = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : null));
  e.respondWith(Promise.race([net, timeout(4000)])
    .catch(() => fallback().then(r => r || net))      // slow or offline: use the saved copy if there is one
    .catch(() => fallback().then(r => r || Response.error())));
});
