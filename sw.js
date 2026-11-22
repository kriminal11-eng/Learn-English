// Offline support: app shell cached, articles network-first, dictionary cache-first.
const VERSION = "v1";
const SHELL = ["./", "index.html", "css/style.css", "js/app.js", "js/store.js", "js/dict.js", "js/tts.js", "js/grammar.js", "js/quiz.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open("shell-" + VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("shell-") && k !== "shell-" + VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } });
  }
}
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  if (url.pathname.includes("/data/dict/")) return e.respondWith(cacheFirst(e.request, "dict"));
  if (url.pathname.includes("/data/")) return e.respondWith(networkFirst(e.request, "articles"));
  e.respondWith(networkFirst(e.request, "shell-" + VERSION));
});
