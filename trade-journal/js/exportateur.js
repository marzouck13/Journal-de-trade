/* ============================================================
   EXPORTATEUR - Export vers un dossier visible de l'appareil
   ------------------------------------------------------------
   Version : 1.0
   Derniere mise a jour : Creation

   Utilise la File System Access API (Chrome, Edge, Opera).
   Permet d'exporter toutes les donnees + captures d'ecran
   dans un vrai dossier visible dans le Finder / Explorateur.
   ============================================================ */
const Exportateur = (() => {

  function supporte() {
    return typeof window.showDirectoryPicker === 'function';
  }

  async function exporterVersDossier() {
    if (!supporte()) {
      throw new Error('Ton navigateur ne supporte pas l\'export vers un dossier. Utilise Chrome, Edge ou Opera.');
    }

    const racine = await window.showDirectoryPicker({ mode: 'readwrite' });

    const data = await Donnees.exporterJSON();
    await ecrireTexte(racine, 'data.json', JSON.stringify(data, null, 2));

    const capturesDossier = await racine.getDirectoryHandle('captures', { create: true });
    const trades = await Stockage.tous('trades');
    let nbCaptures = 0;

    for (const t of trades) {
      if (!t.captureAvant && !t.captureApres) continue;

      const tradeDossier = await capturesDossier.getDirectoryHandle(t.id, { create: true });

      for (const pos of ['avant', 'apres']) {
        const champ = pos === 'avant' ? 'captureAvant' : 'captureApres';
        const chemin = t[champ];
        if (!chemin) continue;

        if (!StockageImages.estLegacyBase64(chemin) && !chemin.startsWith('http')) {
          const fichier = await Stockage.lireFichier(chemin);
          if (fichier) {
            const nomFichier = extraireNom(chemin, pos);
            await ecrireBlob(tradeDossier, nomFichier, fichier);
            nbCaptures++;
          }
        }
        else if (StockageImages.estLegacyBase64(chemin)) {
          try {
            const blob = await fetch(chemin).then(r => r.blob());
            const nomFichier = pos + '.jpg';
            await ecrireBlob(tradeDossier, nomFichier, blob);
            nbCaptures++;
          } catch (e) {
            console.warn('[Export] Capture base64 echouee pour ' + t.id);
          }
        }
      }
    }

    const readme =
      'TRADE JOURNAL - EXPORT DE DONNEES\n' +
      '=================================\n\n' +
      'Date d\'export : ' + new Date().toLocaleString('fr-FR') + '\n' +
      'Version : 3.0\n\n' +
      'CONTENU DU DOSSIER\n' +
      '------------------\n\n' +
      'data.json         : Toutes tes donnees structurees\n' +
      '                    (trades, objectifs, challenges, notes, lecons, parametres)\n\n' +
      'captures/         : Dossier contenant tes captures d\'ecran\n' +
      '                    organisees par trade (un sous-dossier par ID de trade)\n\n' +
      'COMMENT RESTAURER\n' +
      '-----------------\n\n' +
      '1. Ouvre Trade Journal\n' +
      '2. Va dans Parametres\n' +
      '3. Clique sur "Importer depuis un dossier"\n' +
      '4. Selectionne CE dossier\n\n' +
      'Tes donnees et captures seront restaurees.\n\n' +
      'CONSEIL\n' +
      '-------\n\n' +
      'Conserve ce dossier en lieu sur. Il contient toutes tes donnees\n' +
      'de trading. Tu peux le copier sur une cle USB ou un disque externe\n' +
      'pour sauvegarde.\n';

    await ecrireTexte(racine, 'README.txt', readme);

    return {
      trades: trades.length,
      captures: nbCaptures,
      dossierNom: racine.name
    };
  }

  async function importerDepuisDossier() {
    if (!supporte()) {
      throw new Error('Ton navigateur ne supporte pas l\'import depuis un dossier. Utilise Chrome, Edge ou Opera.');
    }

    const racine = await window.showDirectoryPicker({ mode: 'read' });

    let data;
    try {
      const fichier = await lireFichier(racine, 'data.json');
      data = JSON.parse(fichier);
    } catch (e) {
      throw new Error('Impossible de lire data.json. Verifie que tu as bien selectionne le bon dossier.');
    }

    const stats = await Donnees.importerJSON(data, { remplacer: true });

    let nbCaptures = 0;
    let capturesDossier = null;

    try {
      capturesDossier = await racine.getDirectoryHandle('captures');
    } catch (e) {
      capturesDossier = null;
    }

    if (capturesDossier) {
      for (const t of data.trades || []) {
        try {
          const tradeDossier = await capturesDossier.getDirectoryHandle(t.id);

          for (const pos of ['avant', 'apres']) {
            let fichier = null;
            let ext = 'webp';

            for (const e of ['webp', 'jpg', 'jpeg', 'png']) {
              try {
                const fh = await tradeDossier.getFileHandle(pos + '.' + e);
                fichier = await fh.getFile();
                ext = e;
                break;
              } catch (err) {}
            }

            if (fichier) {
              const chemin = await StockageImages.uploader(t.id, pos, fichier, ext);
              const trade = await Donnees.trade(t.id);
              if (trade) {
                if (pos === 'avant') trade.captureAvant = chemin;
                else trade.captureApres = chemin;
                await Donnees.majTrade(trade);
              }
              nbCaptures++;
            }
          }
        } catch (e) {}
      }
    }

    return {
      trades: stats.trades,
      notes: stats.notes,
      lecons: stats.lecons,
      captures: nbCaptures,
      dossierNom: racine.name
    };
  }

  async function ecrireTexte(dossier, nom, contenu) {
    const handle = await dossier.getFileHandle(nom, { create: true });
    const writable = await handle.createWritable();
    await writable.write(contenu);
    await writable.close();
  }

  async function ecrireBlob(dossier, nom, blob) {
    const handle = await dossier.getFileHandle(nom, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function lireFichier(dossier, nom) {
    const handle = await dossier.getFileHandle(nom);
    const fichier = await handle.getFile();
    return await fichier.text();
  }

  function extraireNom(chemin, position) {
    const parties = String(chemin).split('/');
    const nom = parties[parties.length - 1];
    if (nom && nom.includes('.')) return nom;
    return position + '.webp';
  }

  return {
    supporte,
    exporterVersDossier,
    importerDepuisDossier
  };
})();