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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches
            .open("turnarchist-v1")
            .then((cache) => cache.put(event.request, copy));
          return response;
        })
      );
    }),
  );
});
