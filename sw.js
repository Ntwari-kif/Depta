/* Depta service worker: installable + friendly offline page. Pages and /api data are ALWAYS fetched live (money data must never be stale). */
const V = "depta-v2";
const SHELL = ["/offline", "/static/style.css", "/static/common.js", "/static/depta.js", "/static/i18n.js", "/static/theme.js", "/static/pwa.js", "/static/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") { e.respondWith(fetch(req).catch(() => caches.match("/offline"))); return; }
  if (url.pathname.startsWith("/static/")) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req)));
  }
});
