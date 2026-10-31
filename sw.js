/* Soda Lab service worker: cache-first app shell.
   Bump CACHE whenever any file in SHELL changes, or phones keep the old copy. */
const CACHE = 'sodalab-v4';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './badges.js',
  './app.js',
  './manifest.json',
  './icons/favicon.ico',
  './icons/favicon-16.png',
  './icons/favicon-32.png',
  './icons/apple-touch-icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/badges/mystery.svg',
  ...['first-pour', 'shelf-starter', 'lab-regular', 'full-glass', 'dressed-up', 'fully-charmed', 'encore',
    'lucky-pour', 'epic-find', 'legend-in-a-bottle', 'mythic', 'base-tour', 'pantry-explorer',
    'secret-recipe', 'combo-hunter', 'fusion', 'family-tree', 'flavor-of-the-day']
    .flatMap(id => [`./icons/badges/${id}.svg`, `./icons/badges/${id}-locked.svg`]),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
