/* ============================================================
   PWA-REGISTER - Enregistrement du service worker
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   - Enregistre le service worker
   - Detecte les mises a jour et propose de recharger
   - Ne fait rien si l'environnement ne supporte pas
   ============================================================ */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  window.addEventListener('load', () => {
    const chemin = (location.pathname.includes('/pages/') ? '../' : './') + 'service-worker.js';

    navigator.serviceWorker.register(chemin, { scope: './' })
      .then((registration) => {
        console.log('[PWA] Service worker enregistre');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              afficherBanniereMiseAJour();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Echec enregistrement SW :', err);
      });
  });

  function afficherBanniereMiseAJour() {
    const banniere = document.createElement('div');
    banniere.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'background:var(--bg-3);border:1px solid var(--border-2);' +
      'padding:12px 18px;border-radius:12px;z-index:9999;' +
      'box-shadow:var(--shadow);display:flex;align-items:center;gap:12px;' +
      'font-size:13px;color:var(--text);';

    banniere.innerHTML =
      '<span>Une nouvelle version est disponible.</span>' +
      '<button class="btn btn-primary btn-sm" id="pwa-reload">Recharger</button>' +
      '<button class="btn btn-ghost btn-sm" id="pwa-dismiss">Plus tard</button>';

    document.body.appendChild(banniere);

    banniere.querySelector('#pwa-reload').onclick = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => location.reload(), 200);
      });
    };

    banniere.querySelector('#pwa-dismiss').onclick = () => banniere.remove();
  }
})();