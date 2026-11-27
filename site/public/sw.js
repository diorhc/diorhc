// Service Worker for Diorhc Portfolio (Astro build)
const CACHE_NAME = "diorhc-portfolio-v4";
const PRECACHE_URLS = ["./", "./index.html", "./manifest.json", "./favicon.svg"];
// Hashed build assets change on every deploy; without a cap, old ones pile up.
const MAX_ENTRIES = 80;

async function putAndTrim(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  const keys = await cache.keys();
  const precached = new Set(
    PRECACHE_URLS.map((path) => new URL(path, self.registration.scope).href)
  );
  // cache.keys() returns entries in insertion order, so the oldest go first.
  const evictable = keys.filter((req) => !precached.has(req.url));
  const excess = keys.length - MAX_ENTRIES;
  for (let i = 0; i < excess && i < evictable.length; i++) {
    await cache.delete(evictable[i]);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            putAndTrim(request, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            putAndTrim(request, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
