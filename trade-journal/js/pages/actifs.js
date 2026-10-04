/* ============================================================
   ACTIFS - Analyse par actif
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Utilisation de Utils.symboles() pour l'univers
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const p = Utils.parametres();
  const symboles = Utils.symboles();
  const parActif = Calculs.parActif(trades);
  const stats = {};
  for (const a of symboles) stats[a] = Calculs.statsGlobales(parActif[a] || []);

  const cartes = document.getElementById('cartes');
  cartes.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';

  if (!symboles.length) {
    cartes.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty">Aucun actif dans ton univers. <a href="parametres.html" style="color:var(--accent)">Configurer</a></div></div>';
  } else {
    cartes.innerHTML = symboles.map(a => {
      const s = stats[a];
      return '<a class="asset-card" href="#' + Utils.escapeHtml(a) + '">' +
        '<div class="asset-card-symbol">' + Utils.escapeHtml(a) + '</div>' +
        '<div class="asset-card-name">' + Utils.escapeHtml(Utils.nomActif(a)) + '</div>' +
        '<div class="asset-card-value ' + (s.pnl >= 0 ? 'pos' : 'neg') + '">' + Utils.formatMonnaie(s.pnl) + '</div>' +
        '<div class="asset-card-meta"><span>' + s.total + ' trades</span><span>WR ' + s.winrate.toFixed(0) + '%</span></div>' +
        '</a>';
    }).join('');
  }

  if (symboles.length) {
    Graphiques.barresParActif('c-pnl', stats);
    Graphiques.barresGeneriques('c-wr', symboles, symboles.map(a => stats[a].winrate),
      { couleurPositive: false, formatter: v => v.toFixed(0) + '%' });
  } else {
    document.getElementById('c-pnl').parentElement.innerHTML = '<div class="empty">Aucun actif.</div>';
    document.getElementById('c-wr').parentElement.innerHTML = '<div class="empty">Aucun actif.</div>';
  }

  const tbody = document.getElementById('tbody');
  if (!symboles.length) {
    tbody.innerHTML = '<tr><td colspan="16"><div class="empty">Aucun actif dans ton univers.</div></td></tr>';
  } else {
    tbody.innerHTML = symboles.map(a => {
      const arr = parActif[a] || [];
      const s = stats[a];
      const parJour = Calculs.parJour(arr);
      const jours = Object.entries(parJour).map(([d, ts]) => ({
        d, pnl: ts.reduce((sum, t) => sum + Utils.nombre(t.resultat), 0)
      }));
      const meilleurJour = jours.length ? jours.reduce((a,b) => a.pnl > b.pnl ? a : b) : null;
      const pireJour = jours.length ? jours.reduce((a,b) => a.pnl < b.pnl ? a : b) : null;

      const courbe = Calculs.courbeCapital(arr, p.capitalInitial || 0);
      const pnlPct = (p.capitalInitial || 0) > 0 ? (s.pnl / p.capitalInitial) * 100 : 0;

      return '<tr>' +
        '<td data-label="Actif"><strong>' + Utils.escapeHtml(a) + '</strong><br><span class="text-xs muted">' + Utils.escapeHtml(Utils.nomActif(a)) + '</span></td>' +
        '<td data-label="Trades" class="num">' + s.total + '</td>' +
        '<td data-label="Gagnants" class="num pos">' + s.gagnants + '</td>' +
        '<td data-label="Perdants" class="num neg">' + s.perdants + '</td>' +
        '<td data-label="Winrate" class="num">' + s.winrate.toFixed(1) + ' %</td>' +
        '<td data-label="P&L" class="num ' + (s.pnl>=0?'pos':'neg') + '">' + Utils.formatMonnaie(s.pnl) + '</td>' +
        '<td data-label="P&L %" class="num ' + (pnlPct>=0?'pos':'neg') + '">' + Utils.formatPourcent(pnlPct) + '</td>' +
        '<td data-label="R total" class="num">' + Utils.formatR(s.rTotal) + '</td>' +
        '<td data-label="R moyen" class="num">' + Utils.formatR(s.rMoyen) + '</td>' +
        '<td data-label="Expectancy" class="num">' + Utils.formatR(s.expectancy) + '</td>' +
        '<td data-label="PF" class="num">' + (isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : 'Infini') + '</td>' +
        '<td data-label="DD max" class="num neg">' + courbe.maxDDPct.toFixed(1) + ' %</td>' +
        '<td data-label="Gain moy." class="num pos">' + Utils.formatMonnaie(s.gainMoyen) + '</td>' +
        '<td data-label="Perte moy." class="num neg">' + Utils.formatMonnaie(s.perteMoyenne) + '</td>' +
        '<td data-label="Meilleur jour">' + (meilleurJour ? Utils.formatDate(meilleurJour.d) + ' (' + Utils.formatMonnaie(meilleurJour.pnl) + ')' : '-') + '</td>' +
        '<td data-label="Pire jour">' + (pireJour ? Utils.formatDate(pireJour.d) + ' (' + Utils.formatMonnaie(pireJour.pnl) + ')' : '-') + '</td>' +
        '</tr>';
    }).join('');
  }
});