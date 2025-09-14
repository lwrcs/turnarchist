self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("turnarchist-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/play.html",
        "/style.css",
        "/pagestyle.css",
        "/manifest.webmanifest",
        "/res/favicon.png",
      ]);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests and static assets
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const copy = response.clone();
            caches
              .open("turnarchist-v1")
              .then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
      );
    }),
  );
});
