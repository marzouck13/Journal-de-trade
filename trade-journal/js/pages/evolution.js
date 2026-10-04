/* ============================================================
   EVOLUTION - Courbe de capital et drawdown
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const p = Utils.parametres();
  const courbe = Calculs.courbeCapital(trades, p.capitalInitial || 0);
  const stats = Calculs.statsGlobales(trades);

  const perf = p.capitalInitial > 0 ? ((courbe.capitalActuel - p.capitalInitial) / p.capitalInitial) * 100 : 0;

  const kpis = [
    ['Capital initial', Utils.formatMonnaie(p.capitalInitial)],
    ['Capital actuel', Utils.formatMonnaie(courbe.capitalActuel)],
    ['Performance', Utils.formatPourcent(perf)],
    ['Pic historique', Utils.formatMonnaie(courbe.peak)],
    ['Drawdown actuel', Utils.formatPourcent(courbe.ddActuelPct)],
    ['Drawdown max', Utils.formatPourcent(courbe.maxDDPct)],
    ['Nombre de trades', stats.total]
  ];
  document.getElementById('kpis').innerHTML = kpis.map(([l,v]) =>
    '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value">' + v + '</div></div>'
  ).join('');

  document.getElementById('topbar-sub').textContent = stats.total + ' trades - Capital : ' + Utils.formatMonnaie(courbe.capitalActuel);

  if (courbe.points.length) {
    Graphiques.courbeCapital('c-capital', courbe.points, p.capitalInitial);
    Graphiques.pnlCumule('c-pnl', courbe.points);
    Graphiques.drawdown('c-dd', courbe.points);
  } else {
    ['c-capital','c-pnl','c-dd'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.parentElement.innerHTML = '<div class="empty">Aucune donnee.</div>';
    });
  }
});