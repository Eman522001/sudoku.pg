const SHELL_CACHE = "sudoku-shell-v1";
const FONT_CACHE = "sudoku-fonts-v1";
const KEEP_CACHES = [SHELL_CACHE, FONT_CACHE];

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/sudoku-engine.js",
  "./js/symbols.js",
  "./js/pages.js",
  "./js/exporter.js",
  "./js/app.js",
  "./js/pwa.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

const EXTERNAL_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdnjs.cloudflare.com"
]);

self.addEventListener("install", (event) => {
  const urls = SHELL_FILES.map((path) => new URL(path, self.location.href).href);
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(urls)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const page = await cache.match(new URL("./index.html", self.location.href).href);
      if (page) return page;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok || response.type === "opaque") {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  });

  if (cached) {
    network.catch(() => {});
    return cached;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (EXTERNAL_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
