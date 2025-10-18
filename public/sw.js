// Service worker file
// This file is intentionally kept simple for now.
// It's main purpose is to make the app installable (PWA).

self.addEventListener('install', (event) => {
  // console.log('Service Worker installing.');
  // Optionally, you can pre-cache assets here.
});

self.addEventListener('activate', (event) => {
  // console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // For now, we are just using a network-first strategy.
  // This means we'll try to get the resource from the network,
  // and if that fails, we'll try to get it from the cache.
  event.respondWith(
    fetch(event.request).catch(() => {
      // This is a very basic offline fallback.
      // It will only work for navigation requests (e.g., trying to load a page).
      // A more robust solution would involve caching key assets.
      if (event.request.mode === 'navigate') {
        return new Response("<h1>Você está offline</h1><p>Por favor, verifique sua conexão com a internet.</p>", {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    })
  );
});
