const CACHE_VERSION = "identityhub-pro-v8";
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

  "./assets/screenshots/desktop-wide.png",
  "./assets/screenshots/mobile-narrow.png",

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
  "./js/pwa.js",
  "./js/install.js",
  "./js/motion.js",
  
];

/*
 * Instala o Service Worker e guarda os ficheiros essenciais.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const results = await Promise.allSettled(
        APP_SHELL.map((file) => cache.add(file))
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            `Não foi possível guardar na cache: ${APP_SHELL[index]}`,
            result.reason
          );
        }
      });

      await self.skipWaiting();
    })
  );
});

/*
 * Apaga versões antigas da cache.
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
 * Tenta obter a versão mais recente através da Internet.
 * Se não houver ligação, utiliza a versão guardada.
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (
          response &&
          (response.ok || response.type === "opaque")
        ) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(request, response.clone());
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          return caches.match(OFFLINE_PAGE);
        }

        return Response.error();
      })
  );
});