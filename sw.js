/* Soda Lab service worker: cache-first app shell.
   The cache name is sodalab- plus SODALAB_VERSION. Bump version.js to drop
   the previous shell. version.js itself is never answered from an old
   sodalab-* cache: the next worker imports it, and its install precaches
   it, while this worker may still be the one handling fetches. */
importScripts('./version.js');

const CACHE = 'sodalab-' + SODALAB_VERSION;
const SHELL = [
  './',
  './index.html',
  './version.js',
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

/* Install fetches bypass the HTTP cache. A default fetch can replay the
   previous version.js (and the rest of the shell) into the new cache. */
function precacheRequest(path) {
  return new Request(new URL(path, self.location), { cache: 'reload' });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL.map(precacheRequest)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('sodalab-') && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isVersionScript(url) {
  return url.pathname.endsWith('/version.js');
}

/* Network, then the precached copy. Used for version.js and for any fetch
   that already asked to bypass the cache (the installing worker's precache). */
function live(req) {
  return fetch(req.url, { cache: 'reload' }).catch(() =>
    caches.match(req).then(hit => hit || Promise.reject(new TypeError('offline and uncached')))
  );
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isVersionScript(url) || req.cache === 'reload' || req.cache === 'no-store') {
    e.respondWith(live(req));
    return;
  }

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
