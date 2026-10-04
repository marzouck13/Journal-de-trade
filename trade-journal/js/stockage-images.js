/* ============================================================
   STOCKAGE-IMAGES - Captures vers OPFS
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Remplacement Supabase Storage par OPFS

   Les images sont stockees sur l'appareil de l'utilisateur
   dans un systeme de fichiers sandboxe (OPFS). Fonctionne
   hors ligne, sans aucune connexion a un serveur.

   Chemin :
     captures/{trade_id}/avant.webp
     captures/{trade_id}/apres.webp
   ============================================================ */
const StockageImages = (() => {
  const DOSSIER = 'captures';

  function cheminPour(tradeId, position, ext) {
    if (!tradeId) throw new Error('tradeId manquant');
    if (position !== 'avant' && position !== 'apres') {
      throw new Error('Position invalide (avant|apres)');
    }
    const extension = ext || 'webp';
    return DOSSIER + '/' + tradeId + '/' + position + '.' + extension;
  }

  async function uploader(tradeId, position, blob, ext) {
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('Blob invalide');
    }
    const dispo = await Stockage.opfsDisponible();
    if (!dispo) throw new Error('Stockage local indisponible sur ce navigateur');

    const extFinale = ext || (blob.type === 'image/webp' ? 'webp' : 'jpg');
    const chemin = cheminPour(tradeId, position, extFinale);

    await Stockage.ecrireFichier(chemin, blob);
    return chemin;
  }

  async function urlSignee(chemin) {
    if (!chemin) return null;
    const fichier = await Stockage.lireFichier(chemin);
    if (!fichier) return null;
    return URL.createObjectURL(fichier);
  }

  async function urlsSignees(chemins) {
    const valides = (chemins || []).filter(Boolean);
    const map = {};
    for (const c of valides) {
      const url = await urlSignee(c);
      if (url) map[c] = url;
    }
    return map;
  }

  async function supprimer(chemin) {
    if (!chemin) return false;
    return await Stockage.supprimerFichier(chemin);
  }

  async function supprimerPourTrade(tradeId) {
    if (!tradeId) return false;
    return await Stockage.supprimerDossier(DOSSIER + '/' + tradeId);
  }

  function extraireChemin(valeur) {
    if (!valeur || typeof valeur !== 'string') return null;
    if (valeur.startsWith('data:')) return null;
    if (valeur.startsWith('blob:')) return null;
    if (valeur.startsWith('http')) return null;
    return valeur;
  }

  function estLegacyBase64(valeur) {
    return typeof valeur === 'string' && valeur.startsWith('data:image/');
  }

  return {
    DOSSIER,
    cheminPour,
    uploader,
    urlSignee,
    urlsSignees,
    supprimer,
    supprimerPourTrade,
    extraireChemin,
    estLegacyBase64
  };
})();