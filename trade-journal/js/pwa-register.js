/* ============================================================
   PWA-REGISTER - Enregistrement du service worker
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Scope racine absolu (fix installation mobile)

   Ameliorations v3.0 :
   - Chemin absolu /service-worker.js (fonctionne depuis /pages/)
   - Scope racine / au lieu de ./
   - Diagnostic complet en console pour debug mobile
   - Detection de l'etat de controle apres installation
   ============================================================ */
(function () {
  'use strict';

  // --- Diagnostic (visible dans la console mobile) ---
  console.group('[PWA Register] Diagnostic');
  console.log('URL courante :', location.href);
  console.log('Protocol     :', location.protocol);
  console.log('Host         :', location.hostname);
  console.log('SW supporte  :', 'serviceWorker' in navigator);
  console.groupEnd();

  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA Register] Service Worker non supporte');
    return;
  }

  if (location.protocol === 'file:') {
    console.warn('[PWA Register] file:// - SW desactive');
    return;
  }

  window.addEventListener('load', () => {
    // IMPORTANT : toujours utiliser un chemin ABSOLU et un scope RACINE
    // Sinon, quand on est dans /pages/, le SW ne controle que /pages/
    // et Chrome Android considere le site NON installable.
    const chemin = '/service-worker.js';
    const options = { scope: '/' };

    console.log('[PWA Register] Enregistrement :', chemin, 'scope:', options.scope);

    navigator.serviceWorker.register(chemin, options)
      .then((registration) => {
        console.log('[PWA Register] SW enregistre');
        console.log('  - Scope reel  :', registration.scope);
        console.log('  - Installing  :', !!registration.installing);
        console.log('  - Waiting     :', !!registration.waiting);
        console.log('  - Active      :', !!registration.active);

        // Verifier apres un delai que le SW controle bien la page
        setTimeout(() => {
          if (navigator.serviceWorker.controller) {
            console.log('[PWA Register] SW controle la page (installable)');
          } else {
            console.warn('[PWA Register] SW enregistre mais ne controle PAS la page.');
            console.warn('   Recharge la page une fois pour activer le controle.');
            console.warn('   Sur Android Chrome, l\'installation ne sera possible');
            console.warn('   qu\'apres ce rechargement.');
          }
        }, 2000);

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
        console.error('[PWA Register] Echec enregistrement SW :', err);
        console.error('  - Nom    :', err.name);
        console.error('  - Message:', err.message);
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