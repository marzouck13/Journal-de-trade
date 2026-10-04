/* ============================================================
   ANTI-FLASH - Applique le theme avant le premier rendu
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Suppression verification auth

   Application gratuite et locale. Aucune authentification.
   Ce script applique uniquement le theme pour eviter un
   flash visuel au chargement.
   ============================================================ */
(function () {
  try {
    var p = JSON.parse(localStorage.getItem('tj_parametres') || '{}');
    document.documentElement.setAttribute('data-theme', p.theme === 'clair' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();