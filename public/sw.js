// Cache version — bump this string to invalidate ALL existing SW caches
// (forces clients to re-fetch app shell on next activation).
const CACHE_NAME = 'app-shell-v2';

// Static assets only — never include '/' or any HTML page that can vary by
// auth state. Navigation requests (HTML) are handled by the fetch listener
// which bypasses the SW entirely.
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Bypass navigation (HTML page) requests entirely — these can vary by
  // auth state and must always hit the network so middleware/server-side
  // redirects work correctly.
  if (request.mode === 'navigate') return;

  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/')
  )
    return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(request))
  );
});
