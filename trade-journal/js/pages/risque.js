/* ============================================================
   RISQUE - Analyse du risque
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
  const alertes = [];

  const risques = trades.map(t => Utils.nombre(t.risquePourcentage)).filter(r => r > 0);
  const risqueMoyen = risques.length ? risques.reduce((a,b)=>a+b,0) / risques.length : 0;
  const risqueMax = risques.length ? Math.max(...risques) : 0;

  const courbe = Calculs.courbeCapital(trades, p.capitalInitial || 0);

  const parJour = Calculs.parJour(trades);
  const cumulJour = {};
  for (const [jour, ts] of Object.entries(parJour)) {
    cumulJour[jour] = ts.reduce((s, t) => s + Utils.nombre(t.risquePourcentage), 0);
  }

  if (risqueMax > p.risqueMaximal) alertes.push('Risque max observe (' + risqueMax.toFixed(2) + ' %) superieur a la limite personnelle (' + p.risqueMaximal + ' %).');
  if (courbe.ddActuelPct > p.drawdownMaximal) alertes.push('Drawdown actuel (' + courbe.ddActuelPct.toFixed(2) + ' %) au-dela de la limite personnelle (' + p.drawdownMaximal + ' %).');
  if (courbe.maxDDPct > p.drawdownMaximal) alertes.push('Drawdown maximal historique (' + courbe.maxDDPct.toFixed(2) + ' %) superieur a la limite (' + p.drawdownMaximal + ' %).');

  const tradesJour = trades.filter(Calculs.dansAujourdhui);
  if (tradesJour.length > p.tradesMaxJour) alertes.push(tradesJour.length + ' trades aujourd\'hui - au-dela de la limite personnelle (' + p.tradesMaxJour + ').');

  let serie = 0, maxSerie = 0;
  for (const t of trades) {
    if (Utils.nombre(t.resultat) < 0) { serie++; maxSerie = Math.max(maxSerie, serie); } else serie = 0;
  }
  if (maxSerie >= 4) alertes.push('Serie de ' + maxSerie + ' pertes consecutives observee dans l\'historique.');

  document.getElementById('alertes').innerHTML = alertes.length
    ? alertes.map(a => '<div class="warn-banner" style="margin-bottom:8px">' + Utils.escapeHtml(a) + '</div>').join('')
    : '<div class="info-banner">Aucune alerte. Tes risques respectent tes limites personnelles.</div>';

  const kpis = [
    ['Risque moyen / trade', Utils.formatPourcent(risqueMoyen)],
    ['Risque max observe', Utils.formatPourcent(risqueMax)],
    ['Limite personnelle', Utils.formatPourcent(p.risqueMaximal)],
    ['Drawdown actuel', Utils.formatPourcent(courbe.ddActuelPct)],
    ['Drawdown maximal', Utils.formatPourcent(courbe.maxDDPct)],
    ['Limite drawdown', Utils.formatPourcent(p.drawdownMaximal)],
    ['Trades aujourd\'hui', tradesJour.length],
    ['Limite trades/jour', p.tradesMaxJour],
    ['Plus longue serie pertes', maxSerie]
  ];
  document.getElementById('kpis').innerHTML = kpis.map(([l,v]) =>
    '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value">' + v + '</div></div>'
  ).join('');

  if (trades.length) {
    const labels = trades.map(t => t.date);
    Graphiques.ligneGenerique('c-risque', labels, [{
      label: 'Risque %', data: trades.map(t => Utils.nombre(t.risquePourcentage)),
      borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 2, tension: 0.2, fill: false
    }]);
    const jours = Object.keys(cumulJour).sort();
    Graphiques.barresGeneriques('c-risque-jour', jours, jours.map(j => cumulJour[j]),
      { couleurPositive: false, formatter: v => v.toFixed(1) + '%' });
  } else {
    document.getElementById('c-risque').parentElement.innerHTML = '<div class="empty">Aucun trade.</div>';
    document.getElementById('c-risque-jour').parentElement.innerHTML = '<div class="empty">Aucun trade.</div>';
  }
});