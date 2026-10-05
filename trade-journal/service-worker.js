/* ============================================================
   SERVICE WORKER - Trade Journal
   ------------------------------------------------------------
   Version : 4.4
   Derniere mise a jour : Ajout de installer.html
   ============================================================ */

const CACHE_VERSION = 'tj-v4.4.0';
const CACHE_STATIQUE = CACHE_VERSION + '-static';
const CACHE_PAGES = CACHE_VERSION + '-pages';

const RESSOURCES_STATIQUES = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/responsive.css',
  './js/vendor/chart.min.js',
  './js/anti-flash.js',
  './js/config.js',
  './js/utilitaires.js',
  './js/stockage.js',
  './js/stockage-images.js',
  './js/exportateur.js',
  './js/donnees.js',
  './js/calculs.js',
  './js/graphiques.js',
  './js/graphiques-config.js',
  './js/notifications.js',
  './js/navigation.js',
  './js/theme.js',
  './js/app.js',
  './js/pwa-register.js',
  './js/pwa-install.js',
  './js/pages/dashboard.js',
  './js/pages/journal.js',
  './js/pages/nouveau-trade.js',
  './js/pages/trade.js',
  './js/pages/parametres.js',
  './pages/journal.html',
  './pages/nouveau-trade.html',
  './pages/trade.html',
  './pages/calendrier.html',
  './pages/graphiques.html',
  './pages/calendrier-economique.html',
  './pages/statistiques.html',
  './pages/actifs.html',
  './pages/setups.html',
  './pages/risque.html',
  './pages/discipline.html',
  './pages/psychologie.html',
  './pages/objectifs.html',
  './pages/challenges.html',
  './pages/evolution.html',
  './pages/notes.html',
  './pages/lecons.html',
  './pages/rapports.html',
  './pages/parametres.html',
  './pages/a-propos.html',
  './pages/soutenir.html',
  './pages/installer.html',
  './pages/merci.html',
  './pages/cgu.html',
  './pages/confidentialite.html',
  './pages/support.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIQUE)
      .then((cache) => cache.addAll(RESSOURCES_STATIQUES))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Erreur installation cache :', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) => {
      return Promise.all(
        noms
          .filter((nom) => nom.startsWith('tj-') && nom !== CACHE_STATIQUE && nom !== CACHE_PAGES)
          .map((nom) => caches.delete(nom))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  const domainesExternes = [
    'tradingview.com', 'tradingview-widget.com',
    's3.tradingview.com', 'scanner.tradingview.com',
    'sebpay.africa'
  ];
  if (domainesExternes.some(d => url.hostname.includes(d))) return;

  if (event.request.method !== 'GET') return;

  const accepte = event.request.headers.get('accept') || '';
  const estPage = accepte.includes('text/html');

  if (estPage) {
    event.respondWith(
      caches.match(event.request).then((cache) => {
        if (cache) return cache;
        return fetch(event.request).then((response) => {
          const copie = response.clone();
          caches.open(CACHE_PAGES).then((c) => c.put(event.request, copie));
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cache) => {
      if (cache) return cache;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copie = response.clone();
        caches.open(CACHE_STATIQUE).then((c) => c.put(event.request, copie));
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});