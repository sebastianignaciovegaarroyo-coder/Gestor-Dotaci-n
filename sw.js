const CACHE_NAME = 'bramaq-offline-v1';

// Aquí le decimos al teléfono TODO lo que debe descargar para funcionar sin internet
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
];

// 1. INSTALACIÓN: Descarga la app al celular/PC
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpia versiones antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTOR SIN INTERNET
self.addEventListener('fetch', (event) => {
  // Ignoramos las llamadas a la base de datos, porque Firebase maneja su propio modo offline
  if (event.request.url.includes('firestore.googleapis.com')) {
      return; 
  }

  // Para todo lo demás (pantallas, colores, botones), busca en el celular primero.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estrategia Stale-While-Revalidate: Muestra lo guardado, pero actualiza por debajo si hay internet.
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
          // Si no hay red y no está en caché, no hace nada (evita colapsos)
      });

      return cachedResponse || fetchPromise;
    })
  );
});
