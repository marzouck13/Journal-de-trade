/* ============================================================
   APP - Initialisation commune
   ------------------------------------------------------------
   Version : 4.0
   Derniere mise a jour : Application locale, plus d'auth

   L'application fonctionne entierement en local (IndexedDB + OPFS).
   Aucune connexion, aucun backend, aucune authentification.
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  Navigation.rendre();
});