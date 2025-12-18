// Service Worker for Portfolio PWA
const CACHE_NAME = "diorhc-portfolio-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/styles.css",
  "/assets/script.js",
  "/assets/input.js",
  "/assets/by.svg",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error("Cache installation failed:", err);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Let API calls and non-GET requests pass through the network directly.
  // This prevents the service worker from serving stale cached responses
  // for dynamic endpoints like /api/message.
  try {
    const requestURL = new URL(event.request.url);

    if (
      requestURL.pathname.startsWith("/api/") ||
      event.request.method !== "GET"
    ) {
      event.respondWith(
        fetch(event.request).catch((err) => {
          console.error("Network request failed for API or non-GET:", err);
          // Return a simple offline response so the client can handle it.
          return new Response("Service unavailable (offline)", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      );
      return;
    }

    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }

          return fetch(event.request).then((response) => {
            // Check if we received a valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          });
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
          return new Response("Service unavailable (offline)", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
    );
  } catch (e) {
    // If URL parsing fails (e.g. non-http schemes), fall back to network
    event.respondWith(fetch(event.request));
  }
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
