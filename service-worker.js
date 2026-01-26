const CACHE_NAME = "turnarchist-v2";

// Use relative URLs so this also works when hosted under a sub-path (e.g. GitHub Pages project sites).
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./play.html",
  "./style.css",
  "./pagestyle.css",
  "./manifest.webmanifest",
  "./res/favicon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clear old cache versions so updated HTML (like help pages) isn't stuck.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests and static assets
  if (event.request.method !== "GET") {
    return;
  }

  const accept = event.request.headers.get("accept") || "";
  const isHTML =
    event.request.mode === "navigate" ||
    accept.includes("text/html") ||
    accept.includes("application/xhtml+xml");

  // HTML/navigation should be network-first so updated pages (e.g. help) show immediately.
  if (isHTML) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            const copy = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, copy);
          }
          return response;
        } catch (err) {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          throw err;
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
      );
    }),
  );
});
