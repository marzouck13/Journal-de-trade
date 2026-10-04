/* ============================================================
   DASHBOARD - Vue d'ensemble
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Correction du bug meilleur/pire trade (filtres separes)
   - Utilisation de Utils.symboles() pour l'univers
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const p = Utils.parametres();
  const symboles = Utils.symboles();

  const alerte = document.getElementById('alerte-capital');
  if (!p.capitalInitial || p.capitalInitial <= 0) {
    alerte.className = 'warn-banner';
    alerte.style.marginBottom = '20px';
    alerte.innerHTML = '<strong>Capital initial non renseigne.</strong> Rends-toi dans <a href="pages/parametres.html" style="color:inherit;text-decoration:underline">Parametres</a> pour saisir ton capital de depart.';
  } else {
    alerte.className = 'hidden';
  }

  const stats = Calculs.statsGlobales(trades);
  const courbe = Calculs.courbeCapital(trades, p.capitalInitial);
  const series = Calculs.series(trades);

  const pnlJour = trades.filter(Calculs.dansAujourdhui).reduce((s,x)=>s+Utils.nombre(x.resultat),0);
  const pnlSemaine = trades.filter(Calculs.dansSemaine).reduce((s,x)=>s+Utils.nombre(x.resultat),0);
  const pnlMois = trades.filter(Calculs.dansMois).reduce((s,x)=>s+Utils.nombre(x.resultat),0);

  const perfTotal = p.capitalInitial > 0
    ? ((courbe.capitalActuel - p.capitalInitial) / p.capitalInitial) * 100 : 0;

  const gains = trades.filter(t => Utils.nombre(t.resultat) > 0);
  const pertes = trades.filter(t => Utils.nombre(t.resultat) < 0);

  const meilleur = gains.length
    ? gains.reduce((best, t) => Utils.nombre(t.resultat) > Utils.nombre(best.resultat) ? t : best)
    : null;
  const pire = pertes.length
    ? pertes.reduce((worst, t) => Utils.nombre(t.resultat) < Utils.nombre(worst.resultat) ? t : worst)
    : null;

  const meilleurTxt = meilleur ? Utils.formatMonnaie(meilleur.resultat) : Utils.formatMonnaie(0);
  const pireTxt    = pire    ? Utils.formatMonnaie(pire.resultat)    : Utils.formatMonnaie(0);
  const meilleurCls = meilleur ? 'pos' : '';
  const pireCls    = pire    ? 'neg' : '';

  const kpis = [
    { l: 'Capital initial', v: Utils.formatMonnaie(p.capitalInitial) },
    { l: 'Capital actuel', v: Utils.formatMonnaie(courbe.capitalActuel), cls: courbe.capitalActuel >= p.capitalInitial ? 'pos' : 'neg' },
    { l: 'P&L total', v: Utils.formatMonnaie(stats.pnl), cls: stats.pnl >= 0 ? 'pos' : 'neg' },
    { l: 'Performance', v: Utils.formatPourcent(perfTotal), cls: perfTotal >= 0 ? 'pos' : 'neg' },
    { l: 'P&L jour', v: Utils.formatMonnaie(pnlJour), cls: pnlJour >= 0 ? 'pos' : 'neg' },
    { l: 'P&L semaine', v: Utils.formatMonnaie(pnlSemaine), cls: pnlSemaine >= 0 ? 'pos' : 'neg' },
    { l: 'P&L mois', v: Utils.formatMonnaie(pnlMois), cls: pnlMois >= 0 ? 'pos' : 'neg' },
    { l: 'Total trades', v: stats.total },
    { l: 'Gagnants', v: stats.gagnants, cls: 'pos' },
    { l: 'Perdants', v: stats.perdants, cls: 'neg' },
    { l: 'Winrate', v: Utils.formatPourcent(stats.winrate) },
    { l: 'Profit factor', v: isFinite(stats.profitFactor) ? Utils.formatNombre(stats.profitFactor, 2) : 'Infini',
      tip: 'Gains bruts / Pertes brutes. >1 = systeme profitable.' },
    { l: 'Expectancy', v: Utils.formatR(stats.expectancy),
      tip: 'Esperance mathematique par trade en R.' },
    { l: 'R moyen', v: Utils.formatR(stats.rMoyen) },
    { l: 'Gain moyen', v: Utils.formatMonnaie(stats.gainMoyen), cls: 'pos' },
    { l: 'Perte moyenne', v: Utils.formatMonnaie(stats.perteMoyenne), cls: 'neg' },
    { l: 'Drawdown actuel', v: Utils.formatPourcent(courbe.ddActuelPct), cls: 'neg' },
    { l: 'Drawdown max', v: Utils.formatPourcent(courbe.maxDDPct), cls: 'neg',
      tip: 'Plus grande baisse depuis un sommet.' },
    { l: 'Meilleur trade', v: meilleurTxt, cls: meilleurCls,
      tip: meilleur ? meilleur.actif + ' - ' + Utils.formatDate(meilleur.date) : 'Aucun gain enregistre' },
    { l: 'Pire trade', v: pireTxt, cls: pireCls,
      tip: pire ? pire.actif + ' - ' + Utils.formatDate(pire.date) : 'Aucune perte enregistree' },
    { l: 'Serie actuelle', v: (series.serieCourante > 0 ? '+' : '') + series.serieCourante, cls: series.serieCourante >= 0 ? 'pos' : 'neg' },
    { l: 'Meilleure serie', v: series.meilleureSerie, cls: 'pos' },
    { l: 'Plus longue pertes', v: series.plusLongueSeriePerdante, cls: 'neg' }
  ];

  const container = document.getElementById('kpi-principal');
  container.innerHTML = kpis.map(k =>
    '<div class="kpi">' +
    '<div class="kpi-label ' + (k.tip ? 'tooltip' : '') + '" ' + (k.tip ? 'data-tip="' + Utils.escapeHtml(k.tip) + '"' : '') + '>' + k.l + '</div>' +
    '<div class="kpi-value ' + (k.cls || '') + '">' + k.v + '</div>' +
    '</div>'
  ).join('');

  const parActif = Calculs.parActif(trades);
  const univ = document.getElementById('mon-univers');
  univ.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';

  if (!symboles.length) {
    univ.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty">Aucun actif dans ton univers. <a href="pages/parametres.html" style="color:var(--accent)">Configurer</a></div></div>';
  } else {
    univ.innerHTML = symboles.map(a => {
      const arr = parActif[a] || [];
      const s = Calculs.statsGlobales(arr);
      const nom = Utils.nomActif(a);
      const dernier = arr.length ? arr[arr.length-1] : null;
      const clsPnl = s.pnl > 0 ? 'pos' : (s.pnl < 0 ? 'neg' : '');
      return '<a class="asset-card" href="pages/actifs.html?actif=' + encodeURIComponent(a) + '">' +
        '<div class="asset-card-symbol">' + Utils.escapeHtml(a) + '</div>' +
        '<div class="asset-card-name">' + Utils.escapeHtml(nom) + '</div>' +
        '<div class="asset-card-value ' + clsPnl + '">' + Utils.formatMonnaie(s.pnl) + '</div>' +
        '<div class="asset-card-meta">' +
          '<span>' + s.total + ' trades</span>' +
          '<span>WR ' + s.winrate.toFixed(0) + '%</span>' +
          '<span>R moy ' + Utils.formatR(s.rMoyen,1) + '</span>' +
        '</div>' +
        '<div class="asset-card-meta">' +
          '<span>PF ' + (isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : 'Infini') + '</span>' +
          '<span>Dernier : <span class="' + (dernier && Utils.nombre(dernier.resultat)>=0 ? 'pos':'neg') + '">' + (dernier ? Utils.formatMonnaie(dernier.resultat) : '-') + '</span></span>' +
        '</div>' +
        '</a>';
    }).join('');
  }

  const points = courbe.points;
  if (points.length) {
    Graphiques.courbeCapital('chart-capital', points, p.capitalInitial);
    Graphiques.pnlCumule('chart-pnl', points);
    Graphiques.drawdown('chart-dd', points);
    Graphiques.distributionR('chart-distr', Calculs.distributionR(trades));
  } else {
    ['chart-capital','chart-pnl','chart-dd','chart-distr','chart-actifs','chart-mois'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.parentElement.innerHTML = '<div class="empty">Aucune donnee pour le moment.</div>';
    });
  }

  const statsActifs = {};
  for (const a of symboles) statsActifs[a] = Calculs.statsGlobales(parActif[a] || []);
  if (points.length && symboles.length) Graphiques.barresParActif('chart-actifs', statsActifs);

  const parMois = Calculs.parMois(trades);
  if (points.length) Graphiques.pnlMensuel('chart-mois', parMois);

  document.getElementById('topbar-sub').textContent =
    stats.total + ' trades - ' + Utils.formatPourcent(perfTotal) + ' - DD max ' + Utils.formatPourcent(courbe.maxDDPct);
});