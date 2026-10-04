/* ============================================================
   SETUPS - Analyse par setup
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const parSetup = Calculs.parSetup(trades);
  const setupsPerso = await Donnees.getSetups();

  const labels = Array.from(new Set([...setupsPerso, ...Object.keys(parSetup)]));
  const stats = {};
  labels.forEach(k => stats[k] = Calculs.statsGlobales(parSetup[k] || []));

  document.getElementById('liste').textContent = labels.length + ' setup(s) - dont ' + setupsPerso.length + ' personnalise(s)';

  document.getElementById('btn-new').onclick = async () => {
    const nom = prompt('Nom du nouveau setup :');
    if (!nom || !nom.trim()) return;
    await Donnees.ajouterSetup(nom.trim());
    Notif.succes('Setup ajoute.');
    location.reload();
  };

  if (labels.length) {
    Graphiques.barresGeneriques('c-pnl', labels, labels.map(l => stats[l].pnl));
    Graphiques.barresGeneriques('c-wr', labels, labels.map(l => stats[l].winrate),
      { couleurPositive: false, formatter: v => v.toFixed(0) + '%' });
  } else {
    document.getElementById('c-pnl').parentElement.innerHTML = '<div class="empty">Aucun setup pour le moment.</div>';
    document.getElementById('c-wr').parentElement.innerHTML = '<div class="empty">Aucun setup pour le moment.</div>';
  }

  const tbody = document.getElementById('tbody');
  if (!labels.length) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty">Creez un setup ou journalisez un trade.</div></td></tr>';
  } else {
    tbody.innerHTML = labels.map(l => {
      const s = stats[l];
      const estPerso = setupsPerso.includes(l);
      return '<tr>' +
        '<td data-label="Setup"><strong>' + Utils.escapeHtml(l) + '</strong> ' + (estPerso ? '<span class="badge badge-info">perso</span>' : '') + '</td>' +
        '<td data-label="Trades" class="num">' + s.total + '</td>' +
        '<td data-label="Winrate" class="num">' + s.winrate.toFixed(1) + ' %</td>' +
        '<td data-label="P&L" class="num ' + (s.pnl>=0?'pos':'neg') + '">' + Utils.formatMonnaie(s.pnl) + '</td>' +
        '<td data-label="R total" class="num">' + Utils.formatR(s.rTotal) + '</td>' +
        '<td data-label="R moyen" class="num">' + Utils.formatR(s.rMoyen) + '</td>' +
        '<td data-label="Expectancy" class="num">' + Utils.formatR(s.expectancy) + '</td>' +
        '<td data-label="PF" class="num">' + (isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : 'Infini') + '</td>' +
        '<td style="text-align:right">' + (estPerso ? '<button class="btn btn-sm btn-ghost" data-del="' + Utils.escapeHtml(l) + '">x</button>' : '') + '</td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await Notif.confirmer('Supprimer le setup "' + b.dataset.del + '" ?')) return;
        await Donnees.supprimerSetup(b.dataset.del);
        location.reload();
      };
    });
  }
});