const CACHE_VERSION = "identityhub-pro-v1";
const OFFLINE_PAGE = "./index.html";

const APP_SHELL = [
  "./",
  "./index.html",
  "./favicon.svg",
  "./manifest.json",

  "./assets/images/profile.jpg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png",

  "./config/profile.json",

  "./css/style.css",
  "./css/variables.css",
  "./css/reset.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/card.css",
  "./css/buttons.css",
  "./css/qr.css",
  "./css/animations.css",
  "./css/responsive.css",

  "./js/app.js",
  "./js/profile.js",
  "./js/profile-url.js",
  "./js/actions.js",
  "./js/qr.js",
  "./js/vcard.js",
  "./js/share.js",
  "./js/toast.js",
  "./js/pwa.js"
];

/*
 * Guarda os ficheiros essenciais quando o Service Worker
 * é instalado.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/*
 * Elimina versões antigas da cache.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_VERSION)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
 * Guarda uma resposta válida na cache.
 */
async function saveResponse(request, response) {
  if (
    response &&
    (response.ok || response.type === "opaque")
  ) {
    const cache = await caches.open(CACHE_VERSION);

    await cache.put(request, response.clone());
  }

  return response;
}

/*
 * Estratégia Network First:
 * tenta obter a versão mais recente e usa a cache
 * caso a ligação falhe.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    return saveResponse(request, response);
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === "navigate") {
      return caches.match(OFFLINE_PAGE);
    }

    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(networkFirst(request));
});