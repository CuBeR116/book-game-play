/* Работа без сети. Файлы сборки с хэшами в именах кэшируются при первой загрузке,
   дальше отдаются из кэша; страница — сначала из сети (чтобы видеть обновления), без сети — из кэша.
   Меняя логику кэша, подними VERSION. */
const VERSION = "v4";
const CACHE = `book-game-${VERSION}`;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
    "portraits/linea.webp", "portraits/erein.webp", "portraits/velaina.webp", "portraits/leonhard.webp",
    "portraits/hero-linea.webp", "portraits/hero-erein.webp", "portraits/hero-velaina.webp", "portraits/hero-leonhard.webp"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const own = req.url.startsWith(self.location.origin), fonts = req.url.includes("fonts.g");
  if (!own && !fonts) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(hit => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
