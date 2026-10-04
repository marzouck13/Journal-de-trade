/* ============================================================
   CHALLENGES - Suivi des challenges
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const challenges = await Donnees.tousLesChallenges();
  const trades = await Donnees.tousLesTrades();

  function rendre() {
    const c = document.getElementById('content');
    if (!challenges.length) {
      c.innerHTML = '<div class="card"><div class="empty">Aucun challenge. Cree-en un pour te fixer des objectifs structures.</div></div>';
      return;
    }
    c.innerHTML = challenges.map(ch => {
      const tCh = trades.filter(t => (!ch.dateDebut || t.date >= ch.dateDebut) && (!ch.dateFin || t.date <= ch.dateFin));
      const s = Calculs.statsGlobales(tCh);
      const courbe = Calculs.courbeCapital(tCh, 0);
      const progressions = [];
      if (ch.objectifFinancier) progressions.push({ nom: 'Objectif financier', val: s.pnl, cible: ch.objectifFinancier, unite: '$' });
      if (ch.objectifR) progressions.push({ nom: 'Objectif en R', val: s.rTotal, cible: ch.objectifR, unite: 'R' });
      if (ch.risqueMaximum) {
        const risqueRespecte = tCh.filter(t => Utils.nombre(t.risquePourcentage) <= ch.risqueMaximum).length;
        progressions.push({ nom: 'Respect du risque max', val: risqueRespecte, cible: tCh.length, unite: '' });
      }
      if (ch.drawdownMaximum) {
        progressions.push({ nom: 'Drawdown maitrise', val: Math.max(0, ch.drawdownMaximum - courbe.maxDDPct), cible: ch.drawdownMaximum, unite: '%' });
      }
      return '<div class="card" style="margin-bottom:16px">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">' + Utils.escapeHtml(ch.nom) + '</div>' +
            '<div class="card-sub">' + (ch.dateDebut ? Utils.formatDate(ch.dateDebut) : '') + ' ' + (ch.dateFin ? 'a ' + Utils.formatDate(ch.dateFin) : '') + '</div>' +
          '</div>' +
          '<div>' +
            '<button class="btn btn-sm btn-ghost" data-edit="' + ch.id + '">Modifier</button>' +
            '<button class="btn btn-sm btn-ghost" data-del="' + ch.id + '">x</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px">' +
          '<div class="kpi"><div class="kpi-label">Trades</div><div class="kpi-value">' + s.total + '</div></div>' +
          '<div class="kpi"><div class="kpi-label">P&L</div><div class="kpi-value ' + (s.pnl>=0?'pos':'neg') + '">' + Utils.formatMonnaie(s.pnl) + '</div></div>' +
          '<div class="kpi"><div class="kpi-label">R total</div><div class="kpi-value ' + (s.rTotal>=0?'pos':'neg') + '">' + Utils.formatR(s.rTotal) + '</div></div>' +
          '<div class="kpi"><div class="kpi-label">Winrate</div><div class="kpi-value">' + s.winrate.toFixed(0) + ' %</div></div>' +
          '<div class="kpi"><div class="kpi-label">DD max</div><div class="kpi-value neg">' + courbe.maxDDPct.toFixed(1) + ' %</div></div>' +
        '</div>' +
        progressions.map(p => {
          const pct = p.cible > 0 ? Math.min(100, Math.max(0, (p.val / p.cible) * 100)) : 0;
          return '<div style="margin-bottom:12px">' +
            '<div class="row" style="justify-content:space-between;margin-bottom:4px">' +
              '<span class="text-sm">' + p.nom + '</span>' +
              '<span class="text-xs muted">' + Utils.formatNombre(p.val,2) + ' / ' + Utils.formatNombre(p.cible,2) + ' ' + p.unite + ' - ' + pct.toFixed(0) + '%</span>' +
            '</div>' +
            '<div class="progress"><div class="progress-bar pos" style="width:' + pct + '%"></div></div>' +
            '</div>';
        }).join('') +
        '</div>';
    }).join('');

    c.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await Notif.confirmer('Supprimer ce challenge ?')) return;
        await Donnees.supprimerChallenge(b.dataset.del);
        location.reload();
      };
    });
    c.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => ouvrirModal(challenges.find(x => x.id === b.dataset.edit));
    });
  }

  function ouvrirModal(ch) {
    const isEdit = !!ch;
    ch = ch || { nom: '', dateDebut: Utils.aujourdhuiISO(), dateFin: '', objectifFinancier: '', objectifR: '', risqueMaximum: '', drawdownMaximum: '' };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header"><div class="modal-title">' + (isEdit ? 'Modifier' : 'Nouveau') + ' challenge</div></div>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Nom</label><input class="input" id="c-nom" value="' + Utils.escapeHtml(ch.nom) + '" placeholder="Ex : Challenge Janvier 2026"></div>' +
            '<div class="form-group"><label class="form-label">Date debut</label><input type="date" class="input" id="c-deb" value="' + (ch.dateDebut||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Date fin</label><input type="date" class="input" id="c-fin" value="' + (ch.dateFin||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Objectif financier ($)</label><input type="number" step="any" class="input" id="c-fin-obj" value="' + (ch.objectifFinancier||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Objectif en R</label><input type="number" step="any" class="input" id="c-r-obj" value="' + (ch.objectifR||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Risque max (%)</label><input type="number" step="any" class="input" id="c-risque" value="' + (ch.risqueMaximum||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Drawdown max autorise (%)</label><input type="number" step="any" class="input" id="c-dd" value="' + (ch.drawdownMaximum||'') + '"></div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="c-annuler">Annuler</button>' +
          '<button class="btn btn-primary" id="c-save">Enregistrer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#c-annuler').onclick = () => overlay.remove();
    overlay.querySelector('#c-save').onclick = async () => {
      const data = {
        id: ch.id,
        nom: overlay.querySelector('#c-nom').value.trim(),
        dateDebut: overlay.querySelector('#c-deb').value,
        dateFin: overlay.querySelector('#c-fin').value,
        objectifFinancier: Utils.nombre(overlay.querySelector('#c-fin-obj').value),
        objectifR: Utils.nombre(overlay.querySelector('#c-r-obj').value),
        risqueMaximum: Utils.nombre(overlay.querySelector('#c-risque').value),
        drawdownMaximum: Utils.nombre(overlay.querySelector('#c-dd').value)
      };
      if (!data.nom) return Notif.erreur('Nom obligatoire.');
      if (isEdit) await Donnees.majChallenge(data);
      else await Donnees.ajouterChallenge(data);
      overlay.remove();
      location.reload();
    };
  }

  document.getElementById('btn-new').onclick = () => ouvrirModal(null);
  rendre();
});