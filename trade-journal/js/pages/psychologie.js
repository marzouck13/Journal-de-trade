/* ============================================================
   PSYCHOLOGIE - Correlation etat mental / resultats
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const groupes = {};
  for (const t of trades) {
    const k = t.etatMental || 'Non renseigne';
    if (!groupes[k]) groupes[k] = [];
    groupes[k].push(t);
  }
  const labels = Object.keys(groupes);
  const stats = {};
  labels.forEach(k => stats[k] = Calculs.statsGlobales(groupes[k]));

  if (labels.length) {
    Graphiques.barresGeneriques('c-mental', labels, labels.map(l => stats[l].rTotal),
      { formatter: v => v.toFixed(1) + 'R' });
  } else {
    document.getElementById('c-mental').parentElement.innerHTML = '<div class="empty">Aucun trade pour le moment.</div>';
  }

  document.getElementById('tbody').innerHTML = labels.length ? labels.map(l => {
    const s = stats[l];
    return '<tr>' +
      '<td data-label="Etat"><strong>' + Utils.escapeHtml(l) + '</strong></td>' +
      '<td data-label="Trades" class="num">' + s.total + '</td>' +
      '<td data-label="R total" class="num ' + (s.rTotal>=0?'pos':'neg') + '">' + Utils.formatR(s.rTotal) + '</td>' +
      '<td data-label="P&L" class="num ' + (s.pnl>=0?'pos':'neg') + '">' + Utils.formatMonnaie(s.pnl) + '</td>' +
      '<td data-label="Winrate" class="num">' + s.winrate.toFixed(1) + ' %</td>' +
      '</tr>';
  }).join('') : '<tr><td colspan="5"><div class="empty">Aucun trade.</div></td></tr>';
});