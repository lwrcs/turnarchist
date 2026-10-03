const CACHE_NAME = "turnarchist-v3";

// Use relative URLs so this also works when hosted under a sub-path (e.g. GitHub Pages project sites).
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./play.html",
  "./style.css",
  "./pagestyle.css",
  "./manifest.webmanifest",
  "./res/favicon.png",
  "./replay-diagnostics.js",
  "./dist/bundle.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("turnarchist-") && k !== CACHE_NAME)
        .map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // The map loader appends timestamps. These routes serve static bytes, so a
  // stable key permits offline loads without collapsing query-sensitive URLs.
  const key = new URL(request.url);
  if (request.mode === "navigate" || /\/res\/levels\/.*\.png$/.test(key.pathname)) {
    key.search = "";
  }
  key.hash = "";
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.status === 200) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(key.href, response.clone());
        } catch (error) {
          // Cache storage can be unavailable or full; keep the network response usable.
          console.warn("Could not cache asset", key.href, error);
        }
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(key.href);
      if (cached) return cached;
      throw error;
    }
  })());
});
