/* ============================================================
   PARAMETRES - Configuration personnelle
   ------------------------------------------------------------
   Version : 4.0
   Derniere mise a jour : Application locale, OPFS, export dossier
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const p = Utils.parametres();

  document.getElementById('p-capital').value = p.capitalInitial || '';
  document.getElementById('p-devise').value = p.devise;
  document.getElementById('p-risque-std').value = p.risqueStandard;
  document.getElementById('p-risque-max').value = p.risqueMaximal;
  document.getElementById('p-dd-max').value = p.drawdownMaximal;
  document.getElementById('p-trades-max').value = p.tradesMaxJour;
  document.getElementById('p-fuseau').value = p.fuseauHoraire;
  document.getElementById('p-format').value = p.formatNombre;

  const dl = document.getElementById('suggestions-symboles');
  CONFIG.ACTIFS_SUGGERES.forEach(s => dl.insertAdjacentHTML('beforeend', '<option value="' + s + '">'));

  function majSelectionTheme() {
    const actif = Theme.lire();
    document.querySelectorAll('#theme-picker .theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === actif);
    });
  }
  majSelectionTheme();
  document.querySelectorAll('#theme-picker .theme-option').forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.theme;
      if (t === Theme.lire()) return;
      Theme.ecrire(t);
      Theme.appliquer(t);
      Theme.majBouton();
      majSelectionTheme();
      Notif.succes(t === 'clair' ? 'Theme clair active.' : 'Theme sombre active.');
    });
  });

  function rendreListeActifs() {
    const liste = Utils.actifs();
    const zone = document.getElementById('liste-actifs');
    if (!liste.length) {
      zone.innerHTML = '<div class="empty">Aucun actif dans ton univers. Ajoute-en au moins un ci-dessous.</div>';
      return;
    }
    zone.innerHTML =
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr><th>Symbole</th><th>Nom affiche</th><th style="width:100px"></th></tr></thead>' +
          '<tbody>' +
            liste.map(a =>
              '<tr>' +
                '<td data-label="Symbole"><strong>' + Utils.escapeHtml(a.symbole) + '</strong></td>' +
                '<td data-label="Nom">' +
                  '<input type="text" class="input" style="padding:4px 8px; font-size:12px" ' +
                         'value="' + Utils.escapeHtml(a.nom) + '" ' +
                         'data-renommer="' + Utils.escapeHtml(a.symbole) + '">' +
                '</td>' +
                '<td style="text-align:right">' +
                  '<button class="btn btn-sm btn-ghost" data-supprimer="' + Utils.escapeHtml(a.symbole) + '" title="Retirer">x</button>' +
                '</td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

    zone.querySelectorAll('[data-renommer]').forEach(input => {
      input.addEventListener('blur', () => {
        const symbole = input.dataset.renommer;
        const nouveauNom = input.value;
        if (nouveauNom && nouveauNom.trim() && nouveauNom !== Utils.nomActif(symbole)) {
          Donnees.renommerActif(symbole, nouveauNom);
          Notif.succes('Nom mis a jour.');
        }
      });
    });

    zone.querySelectorAll('[data-supprimer]').forEach(btn => {
      btn.onclick = async () => {
        const symbole = btn.dataset.supprimer;
        if (!await Notif.confirmer('Retirer "' + symbole + '" de ton univers ?\n\nLes trades existants ne seront pas supprimes.')) return;
        Donnees.supprimerActif(symbole);
        rendreListeActifs();
        Notif.info(symbole + ' retire.');
      };
    });
  }

  document.getElementById('btn-ajouter-actif').onclick = () => {
    const symbole = document.getElementById('actif-symbole').value.trim().toUpperCase();
    const nom = document.getElementById('actif-nom').value.trim();
    if (!symbole) { Notif.erreur('Saisis un symbole.'); return; }

    const liste = Utils.actifs();
    if (liste.some(a => a.symbole === symbole)) {
      Notif.warn(symbole + ' est deja dans ton univers.');
      return;
    }
    Donnees.ajouterActif(symbole, nom || null);
    document.getElementById('actif-symbole').value = '';
    document.getElementById('actif-nom').value = '';
    rendreListeActifs();
    Notif.succes(symbole + ' ajoute.');
  };

  ['actif-symbole', 'actif-nom'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-ajouter-actif').click(); }
    });
  });

  document.getElementById('btn-reset-actifs').onclick = async () => {
    if (!await Notif.confirmer('Reinitialiser ton univers aux 4 actifs par defaut ?')) return;
    Donnees.reinitialiserActifs();
    rendreListeActifs();
    Notif.info('Univers reinitialise.');
  };

  rendreListeActifs();

  document.getElementById('btn-save').onclick = () => {
    const data = {
      ...Utils.parametres(),
      capitalInitial: Utils.nombre(document.getElementById('p-capital').value),
      devise: document.getElementById('p-devise').value,
      risqueStandard: Utils.nombre(document.getElementById('p-risque-std').value),
      risqueMaximal: Utils.nombre(document.getElementById('p-risque-max').value),
      drawdownMaximal: Utils.nombre(document.getElementById('p-dd-max').value),
      tradesMaxJour: Utils.nombre(document.getElementById('p-trades-max').value),
      fuseauHoraire: document.getElementById('p-fuseau').value,
      formatNombre: document.getElementById('p-format').value
    };
    if (data.risqueStandard < 0 || data.risqueMaximal < 0) return Notif.erreur('Les risques doivent etre positifs.');
    if (data.risqueStandard > data.risqueMaximal) return Notif.erreur('Le risque standard ne peut pas depasser le risque maximal.');
    localStorage.setItem('tj_parametres', JSON.stringify(data));
    Notif.succes('Parametres enregistres.');
  };

  document.getElementById('btn-export-json').onclick = async () => {
    const data = await Donnees.exporterJSON();
    Utils.telecharger('trade-journal-' + Utils.aujourdhuiISO() + '.json', JSON.stringify(data, null, 2), 'application/json');
    Notif.succes('Export JSON genere.');
  };

  document.getElementById('btn-export-csv').onclick = async () => {
    const trades = await Donnees.tousLesTrades();
    if (!trades.length) return Notif.warn('Aucun trade a exporter.');
    const entetes = ['date','heureEntree','heureSortie','actif','direction','timeframe','setup','lot',
      'prixEntree','stopLoss','takeProfit','prixSortie','capitalAvant','risquePourcentage','risqueMonetaire',
      'resultat','resultatPourcentage','resultatR','rrPlanifie','rrRealise','statut','respectPlan','etatMental','commentaire','erreur'];
    Utils.telecharger('trades-' + Utils.aujourdhuiISO() + '.csv', Utils.versCSV(trades, entetes), 'text/csv');
    Notif.succes('Export CSV genere.');
  };

  document.getElementById('import-json').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const remplacer = await Notif.confirmer('Remplacer les donnees existantes ? (Non = fusionner)');
      const stats = await Donnees.importerJSON(data, { remplacer });
      Notif.succes('Import reussi : ' + stats.trades + ' trades, ' + stats.notes + ' notes, ' + stats.lecons + ' lecons.');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      Notif.erreur(err.message || 'Erreur lors de l\'import.');
    }
    e.target.value = '';
  });

  document.getElementById('import-csv').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const text = await f.text();
      const lignes = text.split(/\r?\n/).filter(Boolean);
      if (lignes.length < 2) throw new Error('Fichier CSV vide.');
      const parseCSV = (ligne) => {
        const vals = []; let cur = ''; let inQ = false;
        for (let i = 0; i < ligne.length; i++) {
          const c = ligne[i];
          if (c === '"') { if (inQ && ligne[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
          else if (c === ',' && !inQ) { vals.push(cur); cur = ''; }
          else cur += c;
        }
        vals.push(cur);
        return vals;
      };
      const entetes = parseCSV(lignes[0]);
      const trades = [];
      for (let i = 1; i < lignes.length; i++) {
        const vals = parseCSV(lignes[i]);
        const t = {};
        entetes.forEach((h, idx) => { t[h] = vals[idx] ?? ''; });
        if (!t.actif || !String(t.actif).trim()) throw new Error('Ligne ' + (i+1) + ' : actif manquant.');
        ['lot','prixEntree','stopLoss','takeProfit','prixSortie','capitalAvant','risquePourcentage',
         'risqueMonetaire','resultat','resultatPourcentage','resultatR','rrPlanifie','rrRealise'].forEach(k => {
          t[k] = t[k] !== '' ? Utils.nombre(t[k]) : null;
        });
        t.respectPlan = t.respectPlan === 'true' || t.respectPlan === true;
        trades.push(t);
      }
      if (!await Notif.confirmer('Importer ' + trades.length + ' trade(s) ?')) return;
      for (const t of trades) await Donnees.ajouterTrade(t);
      Notif.succes(trades.length + ' trade(s) importe(s).');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      Notif.erreur(err.message || 'Erreur CSV.');
    }
    e.target.value = '';
  });

  const btnExportDossier = document.getElementById('btn-export-dossier');
  const btnImportDossier = document.getElementById('btn-import-dossier');

  if (!Exportateur.supporte()) {
    if (btnExportDossier) {
      btnExportDossier.disabled = true;
      btnExportDossier.title = 'Non supporte par ce navigateur';
    }
    if (btnImportDossier) {
      btnImportDossier.disabled = true;
      btnImportDossier.title = 'Non supporte par ce navigateur';
    }
  } else {
    if (btnExportDossier) {
      btnExportDossier.onclick = async () => {
        try {
          Notif.info('Preparation de l\'export...', 5000);
          const r = await Exportateur.exporterVersDossier();
          Notif.succes('Export reussi : ' + r.trades + ' trades, ' + r.captures + ' captures dans "' + r.dossierNom + '".', 10000);
        } catch (e) {
          if (e.name === 'AbortError') { Notif.info('Export annule.'); return; }
          Notif.erreur('Echec de l\'export : ' + e.message, 10000);
        }
      };
    }

    if (btnImportDossier) {
      btnImportDossier.onclick = async () => {
        if (!await Notif.confirmer('Importer depuis un dossier va REMPLACER toutes tes donnees actuelles.\n\nContinuer ?')) return;
        try {
          Notif.info('Import en cours...', 5000);
          const r = await Exportateur.importerDepuisDossier();
          Notif.succes('Import reussi : ' + r.trades + ' trades, ' + r.captures + ' captures.', 10000);
          setTimeout(() => location.reload(), 2000);
        } catch (e) {
          if (e.name === 'AbortError') { Notif.info('Import annule.'); return; }
          Notif.erreur('Echec de l\'import : ' + e.message, 10000);
        }
      };
    }
  }

  const zoneEspace = document.getElementById('espace-stockage');
  if (zoneEspace) {
    try {
      const { utilisation, quota } = await Stockage.espaceUtilise();
      const mo = (n) => (n / 1024 / 1024).toFixed(2) + ' Mo';
      const pourcentage = quota > 0 ? Math.round((utilisation / quota) * 100) : 0;
      zoneEspace.innerHTML =
        '<div style="font-size:13px;color:var(--text-2);line-height:1.7">' +
          '<div style="margin-bottom:8px">Utilise : <strong>' + mo(utilisation) + '</strong> sur ' + mo(quota) + ' disponibles</div>' +
          '<div class="progress"><div class="progress-bar" style="width:' + pourcentage + '%"></div></div>' +
          '<div style="font-size:11px;color:var(--text-3);margin-top:6px">' + pourcentage + '% utilise</div>' +
        '</div>';
    } catch (e) {
      zoneEspace.innerHTML = '<div class="text-sm muted">Information de stockage indisponible.</div>';
    }
  }

  document.getElementById('btn-vider').onclick = async () => {
    if (!await Notif.confirmer('Supprimer TOUTES les donnees (trades, objectifs, challenges, notes, lecons) ?')) return;
    if (!await Notif.confirmer('Confirmation definitive. Continuer ?')) return;
    await Donnees.toutSupprimer();
    Notif.info('Toutes les donnees ont ete supprimees.');
    setTimeout(() => location.reload(), 700);
  };

  const btnResetTotal = document.getElementById('btn-reset-total');
  if (btnResetTotal) {
    btnResetTotal.onclick = async () => {
      if (!await Notif.confirmer('REINITIALISATION TOTALE :\n\n- Tous les trades\n- Toutes les captures\n- Tous les objectifs, challenges, notes, lecons\n- Tous les parametres\n\nCette action est irreversible. Continuer ?')) return;

      const saisie = prompt('Tape exactement REINITIALISER (en majuscules) pour confirmer :');
      if (saisie !== 'REINITIALISER') {
        Notif.info('Reinitialisation annulee.');
        return;
      }

      try {
        await Donnees.toutSupprimer();
        const captures = await Stockage.lister('captures');
        for (const c of captures) {
          if (c.type === 'directory') {
            await Stockage.supprimerDossier('captures/' + c.nom);
          }
        }
        localStorage.clear();
        sessionStorage.clear();
        Notif.succes('Reinitialisation terminee.', 5000);
        setTimeout(() => location.href = '../index.html', 1500);
      } catch (e) {
        Notif.erreur('Echec de la reinitialisation : ' + e.message, 8000);
      }
    };
  }
});