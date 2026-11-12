/* Service worker de Brazaletes del Poder: guarda el juego en caché para jugar sin internet. */
var CACHE = 'brazaletes-del-poder-v0.8.0';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png', './compartir.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('brazaletes-del-poder-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url); if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { // red primero para la página: siempre la versión nueva si hay internet
    e.respondWith(fetch(e.request).then(function (res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); }); return res; }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    var net = fetch(e.request).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } return res; }).catch(function () { return r || caches.match('./index.html'); });
    return r || net;
  }));
});
