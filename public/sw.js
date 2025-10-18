// Define um nome e versão para o cache
const CACHE_NAME = 'bolao-potiguar-v1';
// Lista de arquivos a serem armazenados em cache na instalação.
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Adicione aqui outros assets estáticos importantes que você queira no cache inicial
];

// Evento de Instalação: é acionado quando o Service Worker é instalado.
self.addEventListener('install', event => {
  // Impede que o Service Worker seja ativado até que o cache esteja completo.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // console.log('Cache aberto');
        // Adiciona todos os URLs definidos ao cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Ativação: é acionado quando o Service Worker é ativado.
// Usado para limpar caches antigos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não estiver na lista de permissões, ele é excluído.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Fetch: é acionado para cada requisição feita pela página.
// Isso permite interceptar a requisição e responder com dados do cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta for encontrada no cache, retorna a resposta do cache.
        if (response) {
          return response;
        }

        // Se não estiver no cache, faz a requisição à rede.
        return fetch(event.request).then(
          response => {
            // Verifica se recebemos uma resposta válida.
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta. A resposta é um stream e só pode ser consumida uma vez.
            // Precisamos de uma cópia para o navegador e outra para o cache.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Se tanto o cache quanto a rede falharem (offline), 
        // você pode retornar uma página offline padrão aqui.
        // Por exemplo: return caches.match('/offline.html');
      })
  );
});
