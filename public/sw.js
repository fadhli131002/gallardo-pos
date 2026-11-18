/**
 * Service Worker - Gallardo Autosport POS (PWA)
 * Standard Anti-Slop Caching & Network Strategy
 * 
 * 1. App Shell & Static: Stale-While-Revalidate / Cache-First for fast load & offline SPA access.
 * 2. Navigation: Network-First fallback to cached /index.html.
 * 3. POS API & Mutations: STRICT Network-Only. NEVER serve stale financial or inventory data.
 */

const CACHE_VERSION = 'gallardo-pos-v1.0.0';
const STATIC_CACHE = `gallardo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `gallardo-dynamic-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap'
];

// Install Event: pre-cache application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets could not be cached immediately:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests (POST, PUT, DELETE) -> Network Only
  if (request.method !== 'GET') {
    return;
  }

  // 2. Ignore non-http/https schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. API calls -> STRICT Network Only (CRITICAL: Zero stale financial/stock data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Koneksi offline: Tidak dapat menghubungi server. Harap periksa jaringan internet Anda.',
            offline: true
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 4. HTML Navigation (SPA routing) -> Network First with /index.html cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex = await cache.match('/index.html');
        if (cachedIndex) return cachedIndex;
        const cachedRoot = await cache.match('/');
        if (cachedRoot) return cachedRoot;
        return new Response('Mode Offline - Gallardo POS', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // 5. Static Assets (Vite bundled JS, CSS, images, web fonts) -> Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|eot|ico)$/i) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Message listener for skipWaiting trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
