/* ============================================================
   JOURNAL - Historique des trades
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Utilisation de Utils.actifs() pour le select actif
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  let tousLesTrades = await Donnees.tousLesTrades();
  let tri = { col: 'date', dir: 'desc' };
  let filtres = {};

  const fActif = document.getElementById('f-actif');
  Utils.actifs().forEach(a =>
    fActif.insertAdjacentHTML('beforeend',
      '<option value="' + Utils.escapeHtml(a.symbole) + '">' + Utils.escapeHtml(a.symbole) + ' - ' + Utils.escapeHtml(a.nom) + '</option>'));

  const fSetup = document.getElementById('f-setup');
  const setups = await Donnees.getSetups();
  const setupsDansTrades = Array.from(new Set(tousLesTrades.map(t => t.setup).filter(Boolean)));
  const tousSetups = Array.from(new Set([...setups, ...setupsDansTrades]));
  tousSetups.forEach(s => fSetup.insertAdjacentHTML('beforeend', '<option>' + Utils.escapeHtml(s) + '</option>'));

  ['recherche','actif','direction','setup','resultat','plan','date-deb','date-fin'].forEach(k => {
    const el = document.getElementById('f-' + k);
    el.addEventListener('input', () => { filtres[k] = el.value; rendre(); });
  });

  document.getElementById('btn-reset').onclick = () => {
    ['recherche','actif','direction','setup','resultat','plan','date-deb','date-fin'].forEach(k => {
      const el = document.getElementById('f-' + k);
      el.value = '';
    });
    filtres = {};
    rendre();
  };

  document.querySelectorAll('th[data-tri]').forEach(th => {
    th.style.cursor = 'pointer';
    th.onclick = () => {
      const col = th.dataset.tri;
      if (tri.col === col) tri.dir = tri.dir === 'asc' ? 'desc' : 'asc';
      else tri = { col, dir: 'desc' };
      rendre();
    };
  });

  function filtrer() {
    return tousLesTrades.filter(t => {
      if (filtres.actif && t.actif !== filtres.actif) return false;
      if (filtres.direction && t.direction !== filtres.direction) return false;
      if (filtres.setup && t.setup !== filtres.setup) return false;
      if (filtres.resultat && t.statut !== filtres.resultat) return false;
      if (filtres.plan === 'oui' && t.respectPlan !== true) return false;
      if (filtres.plan === 'non' && t.respectPlan !== false) return false;
      if (filtres.dateDeb && t.date < filtres.dateDeb) return false;
      if (filtres.dateFin && t.date > filtres.dateFin) return false;
      if (filtres.recherche) {
        const q = filtres.recherche.toLowerCase();
        const hay = [t.commentaire, t.setup, t.actif, t.raisonEntree, t.raisonSortie].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function trier(arr) {
    const { col, dir } = tri;
    const mult = dir === 'asc' ? 1 : -1;
    return arr.slice().sort((a, b) => {
      let va = a[col], vb = b[col];
      if (col === 'resultat' || col === 'resultatR') { va = Utils.nombre(va); vb = Utils.nombre(vb); }
      if (va < vb) return -1 * mult;
      if (va > vb) return 1 * mult;
      return 0;
    });
  }

  function rendre() {
    const arr = trier(filtrer());
    const tbody = document.getElementById('tbody');
    document.getElementById('compteur').textContent = arr.length + ' trade(s)';

    if (!arr.length) {
      tbody.innerHTML = '<tr><td colspan="10"><div class="empty">Aucun trade ne correspond aux filtres.<br><a href="nouveau-trade.html" style="color:var(--accent)">Ajouter un trade</a></div></td></tr>';
      return;
    }

    tbody.innerHTML = arr.map(t => {
      const pnlCls = Utils.nombre(t.resultat) > 0 ? 'pos' : (Utils.nombre(t.resultat) < 0 ? 'neg' : '');
      const dirCls = t.direction === 'BUY' ? 'badge-buy' : 'badge-sell';
      const statutCls = t.statut === 'WIN' ? 'badge-win' : (t.statut === 'LOSS' ? 'badge-loss' : 'badge-be');
      return '<tr>' +
        '<td data-label="Date">' + Utils.formatDate(t.date) + '</td>' +
        '<td data-label="Actif"><strong>' + Utils.escapeHtml(t.actif) + '</strong></td>' +
        '<td data-label="Direction"><span class="badge ' + dirCls + '">' + (t.direction || '-') + '</span></td>' +
        '<td data-label="Setup">' + Utils.escapeHtml(t.setup || '-') + '</td>' +
        '<td data-label="Risque" class="num">' + (t.risquePourcentage ? Utils.formatNombre(t.risquePourcentage,2) + ' %' : '-') + '</td>' +
        '<td data-label="Resultat" class="num ' + pnlCls + '">' + Utils.formatMonnaie(t.resultat) + '</td>' +
        '<td data-label="R" class="num ' + pnlCls + '">' + Utils.formatR(t.resultatR) + '</td>' +
        '<td data-label="Statut"><span class="badge ' + statutCls + '">' + (t.statut || '-') + '</span></td>' +
        '<td data-label="Plan">' + (t.respectPlan ? '<span class="badge badge-info">Oui</span>' : '<span class="badge badge-warn">Non</span>') + '</td>' +
        '<td style="text-align:right"><a class="btn btn-sm btn-ghost" href="trade.html?id=' + t.id + '">Voir</a></td>' +
        '</tr>';
    }).join('');
  }

  rendre();
});