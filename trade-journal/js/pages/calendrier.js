/* ============================================================
   CALENDRIER - Vue mensuelle
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();
  const parJour = Calculs.parJour(trades);

  let cur = new Date();
  cur.setDate(1);

  const nomsMois = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const nomsJours = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  const head = document.getElementById('cal-head');
  head.innerHTML = nomsJours.map(j => '<div class="cal-head">' + j + '</div>').join('');

  function rendre() {
    const y = cur.getFullYear(), m = cur.getMonth();
    document.getElementById('titre-mois').textContent = nomsMois[m] + ' ' + y;

    const prefix = y + '-' + String(m+1).padStart(2,'0');
    const tradesMois = trades.filter(t => t.date.startsWith(prefix));
    const statsMois = Calculs.statsGlobales(tradesMois);
    document.getElementById('topbar-sub').textContent =
      statsMois.total + ' trades - ' + Utils.formatMonnaie(statsMois.pnl) + ' - WR ' + statsMois.winrate.toFixed(0) + '%';

    const premier = new Date(y, m, 1);
    const debut = premier.getDay() === 0 ? 7 : premier.getDay();
    const joursMois = new Date(y, m + 1, 0).getDate();

    let html = '';
    for (let i = 1; i < debut; i++) html += '<div class="cal-day empty"></div>';

    const aujourdhui = Utils.aujourdhuiISO();
    for (let j = 1; j <= joursMois; j++) {
      const iso = y + '-' + String(m+1).padStart(2,'0') + '-' + String(j).padStart(2,'0');
      const tJour = parJour[iso] || [];
      const stats = Calculs.statsGlobales(tJour);
      const cls = tJour.length ? (stats.pnl > 0 ? 'pos' : (stats.pnl < 0 ? 'neg' : '')) : '';
      const clsToday = iso === aujourdhui ? 'today' : '';
      const pnlTxt = tJour.length ? Utils.formatMonnaie(stats.pnl) : '';
      const rTxt = tJour.length ? Utils.formatR(stats.rTotal) : '';
      html +=
        '<div class="cal-day ' + cls + ' ' + clsToday + '" data-date="' + iso + '">' +
          '<div class="cal-day-num">' + j + '</div>' +
          (tJour.length ?
            '<div class="cal-day-pnl ' + (stats.pnl > 0 ? 'pos' : 'neg') + '">' + pnlTxt + '</div>' +
            '<div class="cal-day-meta">' + tJour.length + ' trade(s) - WR ' + stats.winrate.toFixed(0) + '%</div>' +
            '<div class="cal-day-r ' + (stats.rTotal >= 0 ? 'pos':'neg') + '">' + rTxt + '</div>'
            : '<div class="text-xs muted" style="margin-top:auto">-</div>') +
        '</div>';
    }

    const body = document.getElementById('cal-body');
    body.innerHTML = html;

    body.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.onclick = () => afficherJour(el.dataset.date);
    });
  }

  function afficherJour(iso) {
    const tJour = parJour[iso] || [];
    const zone = document.getElementById('detail-jour');
    if (!tJour.length) {
      zone.innerHTML = '<div class="card" style="margin-top:16px"><div class="card-title">' + Utils.formatDate(iso) + '</div><div class="empty">Aucun trade ce jour.</div></div>';
      return;
    }
    const stats = Calculs.statsGlobales(tJour);
    zone.innerHTML =
      '<div class="card" style="margin-top:16px">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">' + Utils.formatDate(iso) + '</div>' +
            '<div class="card-sub">' + stats.total + ' trades - ' + Utils.formatMonnaie(stats.pnl) + ' - ' + Utils.formatR(stats.rTotal) + ' - WR ' + stats.winrate.toFixed(0) + '%</div>' +
          '</div>' +
          '<button class="btn btn-sm" id="btn-fermer-detail">Fermer</button>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<table>' +
            '<thead><tr><th>Heure</th><th>Actif</th><th>Direction</th><th>Setup</th><th class="num">Resultat</th><th class="num">R</th><th>Statut</th><th></th></tr></thead>' +
            '<tbody>' +
              tJour.map(t =>
                '<tr>' +
                  '<td data-label="Heure">' + (t.heureEntree || '-') + '</td>' +
                  '<td data-label="Actif"><strong>' + Utils.escapeHtml(t.actif) + '</strong></td>' +
                  '<td data-label="Direction"><span class="badge ' + (t.direction === 'BUY' ? 'badge-buy' : 'badge-sell') + '">' + (t.direction || '-') + '</span></td>' +
                  '<td data-label="Setup">' + Utils.escapeHtml(t.setup || '-') + '</td>' +
                  '<td data-label="Resultat" class="num ' + (Utils.nombre(t.resultat)>=0?'pos':'neg') + '">' + Utils.formatMonnaie(t.resultat) + '</td>' +
                  '<td data-label="R" class="num ' + (Utils.nombre(t.resultatR)>=0?'pos':'neg') + '">' + Utils.formatR(t.resultatR) + '</td>' +
                  '<td data-label="Statut"><span class="badge ' + (t.statut === 'WIN' ? 'badge-win' : (t.statut === 'LOSS' ? 'badge-loss' : 'badge-be')) + '">' + (t.statut || '-') + '</span></td>' +
                  '<td style="text-align:right"><a class="btn btn-sm btn-ghost" href="trade.html?id=' + t.id + '">Voir</a></td>' +
                '</tr>'
              ).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    document.getElementById('btn-fermer-detail').onclick = () => zone.innerHTML = '';
  }

  document.getElementById('btn-prec').onclick = () => { cur.setMonth(cur.getMonth() - 1); rendre(); };
  document.getElementById('btn-suiv').onclick = () => { cur.setMonth(cur.getMonth() + 1); rendre(); };
  document.getElementById('btn-aujourdhui').onclick = () => { cur = new Date(); cur.setDate(1); rendre(); };

  rendre();
});