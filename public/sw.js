const CACHE_VERSION = "mlmb-static-v2";
const STATIC_CACHE = CACHE_VERSION;
const OFFLINE_FALLBACK_PATH = "/learn";
const STATIC_DESTINATIONS = new Set([
  "document",
  "script",
  "style",
  "image",
  "font",
]);

async function cacheResponse(request, response) {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(STATIC_CACHE);
  await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const network = await networkPromise;
  if (network) {
    return network;
  }

  return Response.error();
}

async function networkFirstDocument(request) {
  try {
    const response = await fetch(request);
    return cacheResponse(request, response);
  } catch {
    const cachedDocument = await caches.match(request);
    if (cachedDocument) {
      return cachedDocument;
    }

    const cachedFallback = await caches.match(OFFLINE_FALLBACK_PATH);
    if (cachedFallback) {
      return cachedFallback;
    }

    return new Response("Offline mode is active. Reconnect to continue.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(["/", OFFLINE_FALLBACK_PATH]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );

  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const shouldHandle =
    STATIC_DESTINATIONS.has(request.destination) ||
    url.pathname === "/" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/");

  if (!shouldHandle) {
    return;
  }

  if (request.destination === "document") {
    event.respondWith(networkFirstDocument(request));

    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
