/* ============================================================
   TRADE - Detail d'un trade
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Application locale, OPFS
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  const c = document.getElementById('content');
  if (!id) { c.innerHTML = '<div class="empty">Trade introuvable.</div>'; return; }

  const t = await Donnees.trade(id);
  if (!t) { c.innerHTML = '<div class="empty">Trade introuvable.</div>'; return; }

  document.getElementById('topbar-sub').textContent =
    t.actif + ' - ' + (t.direction || '') + ' - ' + Utils.formatDate(t.date);

  const pnlCls = Utils.nombre(t.resultat) > 0 ? 'pos' : (Utils.nombre(t.resultat) < 0 ? 'neg' : '');

  let urlAvant = null;
  let urlApres = null;
  if (t.captureAvant) {
    if (StockageImages.estLegacyBase64(t.captureAvant)) {
      urlAvant = t.captureAvant;
    } else {
      urlAvant = await StockageImages.urlSignee(t.captureAvant);
    }
  }
  if (t.captureApres) {
    if (StockageImages.estLegacyBase64(t.captureApres)) {
      urlApres = t.captureApres;
    } else {
      urlApres = await StockageImages.urlSignee(t.captureApres);
    }
  }

  const lignes = [
    ['Date', Utils.formatDate(t.date)],
    ['Heure entree', t.heureEntree || '-'],
    ['Heure sortie', t.heureSortie || '-'],
    ['Session', t.session || '-'],
    ['Actif', t.actif + ' - ' + (Utils.nomActif(t.actif) || '')],
    ['Timeframe', t.timeframe || '-'],
    ['Direction', t.direction || '-'],
    ['Setup', t.setup || '-'],
    ['-', '-'],
    ['Prix entree', t.prixEntree ?? '-'],
    ['Stop Loss', t.stopLoss ?? '-'],
    ['Take Profit', t.takeProfit ?? '-'],
    ['Prix sortie', t.prixSortie ?? '-'],
    ['Lot', t.lot ?? '-'],
    ['-', '-'],
    ['Capital avant', t.capitalAvant ? Utils.formatMonnaie(t.capitalAvant) : '-'],
    ['Risque %', t.risquePourcentage ? Utils.formatPourcent(t.risquePourcentage) : '-'],
    ['Risque $', t.risqueMonetaire ? Utils.formatMonnaie(t.risqueMonetaire) : '-'],
    ['R:R planifie', t.rrPlanifie ?? '-'],
    ['R:R realise', t.rrRealise ?? '-'],
    ['-', '-'],
    ['Resultat $', Utils.formatMonnaie(t.resultat)],
    ['Resultat %', t.resultatPourcentage ? Utils.formatPourcent(t.resultatPourcentage) : '-'],
    ['Resultat en R', Utils.formatR(t.resultatR)],
    ['Statut', t.statut || '-'],
    ['-', '-'],
    ['Respect du plan', t.respectPlan ? 'Oui' : 'Non'],
    ['Etat mental', t.etatMental || '-'],
    ['Erreur', t.erreur || '-']
  ];

  c.innerHTML =
    '<div class="card" style="margin-bottom:16px">' +
      '<div class="row">' +
        '<div>' +
          '<div class="text-sm muted">Resultat net</div>' +
          '<div style="font-size:28px;font-weight:600" class="' + pnlCls + '">' + Utils.formatMonnaie(t.resultat) + '</div>' +
        '</div>' +
        '<div class="spacer"></div>' +
        '<div style="text-align:right">' +
          '<div class="text-sm muted">R</div>' +
          '<div style="font-size:24px;font-weight:600" class="' + pnlCls + '">' + Utils.formatR(t.resultatR) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid-2">' +
      '<div class="card">' +
        '<div class="card-title" style="margin-bottom:12px">Informations</div>' +
        '<div class="table-wrap" style="border:none">' +
          '<table><tbody>' +
            lignes.map(([k,v]) => k === '-'
              ? '<tr><td colspan="2" style="border:none;padding:6px 0"><div class="divider" style="margin:4px 0"></div></td></tr>'
              : '<tr><td class="muted" style="border:none">' + k + '</td><td style="border:none;text-align:right">' + Utils.escapeHtml(String(v)) + '</td></tr>'
            ).join('') +
          '</tbody></table>' +
        '</div>' +
      '</div>' +
      '<div class="stack">' +
        '<div class="card">' +
          '<div class="card-title" style="margin-bottom:8px">Raison de l\'entree</div>' +
          '<div class="text-sm">' + Utils.escapeHtml(t.raisonEntree || '-').replace(/\n/g,'<br>') + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title" style="margin-bottom:8px">Raison de la sortie</div>' +
          '<div class="text-sm">' + Utils.escapeHtml(t.raisonSortie || '-').replace(/\n/g,'<br>') + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title" style="margin-bottom:8px">Commentaire</div>' +
          '<div class="text-sm">' + Utils.escapeHtml(t.commentaire || '-').replace(/\n/g,'<br>') + '</div>' +
        '</div>' +
        ((urlAvant || urlApres) ?
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:8px">Captures</div>' +
            '<div class="grid-2">' +
              (urlAvant ? '<div><div class="text-xs muted">Avant</div><img src="' + urlAvant + '" style="width:100%;border-radius:8px;margin-top:4px;cursor:zoom-in" onclick="window.open(this.src,\'_blank\')"></div>' : '') +
              (urlApres ? '<div><div class="text-xs muted">Apres</div><img src="' + urlApres + '" style="width:100%;border-radius:8px;margin-top:4px;cursor:zoom-in" onclick="window.open(this.src,\'_blank\')"></div>' : '') +
            '</div>' +
          '</div>' : '') +
      '</div>' +
    '</div>' +

    '<div class="row" style="margin-top:20px;justify-content:flex-end">' +
      '<button class="btn" id="btn-dupliquer">Dupliquer</button>' +
      '<a href="nouveau-trade.html?id=' + t.id + '" class="btn">Modifier</a>' +
      '<button class="btn btn-danger" id="btn-suppr">Supprimer</button>' +
    '</div>';

  document.getElementById('btn-suppr').onclick = async () => {
    if (!await Notif.confirmer('Supprimer definitivement ce trade ?')) return;
    try { await StockageImages.supprimerPourTrade(t.id); } catch (e) {}
    await Donnees.supprimerTrade(t.id);
    Notif.succes('Trade supprime.');
    setTimeout(() => location.href = 'journal.html', 400);
  };

  document.getElementById('btn-dupliquer').onclick = async () => {
    const copie = { ...t };
    delete copie.id;
    delete copie.captureAvant;
    delete copie.captureApres;
    copie.date = Utils.aujourdhuiISO();
    await Donnees.ajouterTrade(copie);
    Notif.succes('Trade duplique.');
    setTimeout(() => location.href = 'journal.html', 400);
  };
});