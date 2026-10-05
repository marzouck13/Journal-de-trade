/* ============================================================
   LOADER - Cache l'ecran de chargement une fois la page prete
   ------------------------------------------------------------
   Le loader est affiche par le HTML (div#tj-loader) et le CSS
   (css/loader.css). Ce script se contente de le retirer
   proprement quand le DOM est pret.

   Duree minimale d'affichage :
     - 1800 ms a la premiere visite de la session
     - 1000 ms aux navigations suivantes
   ============================================================ */
(function () {
  'use strict';

  var loader = document.getElementById('tj-loader');
  if (!loader) return;

  var DUREE_SORTIE = 500;

  // Detecte si c'est la premiere visite de la session
  var premiereVisite = false;
  try {
    premiereVisite = !sessionStorage.getItem('tj_loader_ok');
    if (premiereVisite) sessionStorage.setItem('tj_loader_ok', '1');
  } catch (e) {}

  var DUREE_MIN = premiereVisite ? 1800 : 1000;
  var tStart = Date.now();
  var cacheEnCours = false;

  function cacher() {
    if (cacheEnCours) return;
    cacheEnCours = true;

    var ecoule = Date.now() - tStart;
    var attente = Math.max(0, DUREE_MIN - ecoule);

    setTimeout(function () {
      if (!loader || !loader.parentNode) return;
      loader.classList.add('tj-loader-sortie');
      setTimeout(function () {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, DUREE_SORTIE);
    }, attente);
  }

  // Cache des que le DOM est pret
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cacher, { once: true });
  } else {
    cacher();
  }

  // Filet de securite : si quelque chose plante, on cache quand meme
  setTimeout(function () {
    if (!cacheEnCours) cacher();
  }, 6000);
})();