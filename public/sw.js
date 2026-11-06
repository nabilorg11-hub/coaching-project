// Coaching Manager service worker — makes visited pages work without internet.
// version comes from the registration URL (/sw.js?v=<build>), so every new build gets fresh caches
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/login", "/offline.html"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req, fallbackToOfflinePage) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && !res.redirected) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (fallbackToOfflinePage) return (await cache.match("/offline.html")) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?|json)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
  } else if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, true));
  } else if (req.headers.get("RSC") === "1") {
    // client-side navigation payloads; failure makes Next fall back to a full (cached) page load
    e.respondWith(networkFirst(req, false));
  }
});
