// Service worker: guarda la app en el móvil para que abra sin conexión.
// Estrategia: responde desde la copia guardada y la actualiza en segundo plano.
// Nunca toca tus datos (están en localStorage, que este archivo no usa).
const CACHE = "sitios-v1";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // enlaces externos (Maps) no se tocan
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((enCache) => {
      const red = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        })
        .catch(() => enCache);
      return enCache || red;
    })
  );
});
