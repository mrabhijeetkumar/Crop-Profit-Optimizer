const CACHE_NAME = 'krishipro-static-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/static/css/style.css',
    '/static/js/config.js',
    '/static/js/main.js',
    '/static/js/advanced-features.js',
    '/static/images/icon-192.svg',
    '/static/images/icon-512.svg',
    '/static/images/badge-72.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // For API requests, prefer network and fallback to cache when offline.
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(req)
                .then((response) => {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
                    return response;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    // For static assets and pages, use cache first and revalidate in background.
    event.respondWith(
        caches.match(req).then((cached) => {
            const networkFetch = fetch(req)
                .then((response) => {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});
