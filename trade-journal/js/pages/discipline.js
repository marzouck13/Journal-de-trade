/* ============================================================
   DISCIPLINE - Score de discipline
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const d = Calculs.scoreDiscipline(trades);

  document.getElementById('score').textContent = trades.length ? d.score + ' / 100' : '-';

  const kpis = [
    ['Total trades', d.detail.total || 0],
    ['Respect du plan', (d.detail.respectPlan || 0) + ' (' + (d.detail.pctPlan || 0) + '%)'],
    ['Sans erreur', (d.detail.sansErreur || 0) + ' (' + (d.detail.pctSansErreur || 0) + '%)'],
    ['Risque respecte', (d.detail.risqueRespecte || 0) + ' (' + (d.detail.pctRisque || 0) + '%)']
  ];
  document.getElementById('kpis').innerHTML = kpis.map(([l,v]) =>
    '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value">' + v + '</div></div>'
  ).join('');
});