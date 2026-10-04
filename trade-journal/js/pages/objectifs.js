/* ============================================================
   OBJECTIFS - Suivi des objectifs personnels
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const objectifs = await Donnees.tousLesObjectifs();
  const trades = await Donnees.tousLesTrades();
  const p = Utils.parametres();
  const courbe = Calculs.courbeCapital(trades, p.capitalInitial || 0);

  let principal = await Stockage.getMeta('objectif_principal', null);

  async function rafraichirPrincipal() {
    const zone = document.getElementById('objectif-principal');
    if (!principal || !principal.cible) {
      zone.innerHTML = '<div class="empty">Aucun objectif principal defini.<br><button class="btn btn-sm" id="btn-init">Definir</button></div>';
      document.getElementById('btn-init')?.addEventListener('click', editerPrincipal);
      return;
    }
    const ecart = principal.cible - courbe.capitalActuel;
    const pct = principal.cible > 0 ? (courbe.capitalActuel / principal.cible) * 100 : 0;
    zone.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:12px">' +
        '<div><div class="text-xs muted">Capital actuel</div><div style="font-size:22px;font-weight:600">' + Utils.formatMonnaie(courbe.capitalActuel) + '</div></div>' +
        '<div><div class="text-xs muted">Objectif</div><div style="font-size:22px;font-weight:600">' + Utils.formatMonnaie(principal.cible) + '</div></div>' +
        '<div><div class="text-xs muted">Ecart</div><div style="font-size:22px;font-weight:600;color:' + (ecart <= 0 ? 'var(--green)' : 'var(--text)') + '">' + Utils.formatMonnaie(ecart) + '</div></div>' +
      '</div>' +
      '<div class="progress"><div class="progress-bar pos" style="width:' + Math.min(100, Math.max(0, pct)).toFixed(1) + '%"></div></div>' +
      '<div class="row" style="margin-top:8px;justify-content:space-between">' +
        '<div class="text-xs muted">' + pct.toFixed(1) + ' % de progression</div>' +
        (principal.dateCible ? '<div class="text-xs muted">Date cible : ' + Utils.formatDate(principal.dateCible) + '</div>' : '') +
      '</div>' +
      '<div class="grid-2" style="margin-top:20px">' +
        '<div>' +
          '<div class="section-title">Ce qui depend de moi</div>' +
          '<ul style="list-style:none;padding:0;font-size:13px;color:var(--text-2);line-height:1.9">' +
            '<li>Discipline d\'execution</li>' +
            '<li>Respect du risque</li>' +
            '<li>Qualite de la journalisation</li>' +
            '<li>Respect du plan</li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<div class="section-title">Ce qui ne depend pas de moi</div>' +
          '<ul style="list-style:none;padding:0;font-size:13px;color:var(--text-2);line-height:1.9">' +
            '<li>Conditions de marche</li>' +
            '<li>Volatilite future</li>' +
            '<li>Performance future des setups</li>' +
            '<li>Resultats a court terme</li>' +
          '</ul>' +
        '</div>' +
      '</div>';
  }

  function editerPrincipal() {
    const cible = prompt('Objectif de capital a atteindre :', principal?.cible || '');
    if (cible === null) return;
    const dateCible = prompt('Date cible (YYYY-MM-DD) :', principal?.dateCible || '');
    principal = { cible: Utils.nombre(cible), dateCible: dateCible || '' };
    Stockage.setMeta('objectif_principal', principal).then(rafraichirPrincipal);
  }

  document.getElementById('btn-edit-principal').onclick = editerPrincipal;
  await rafraichirPrincipal();

  function rendreListe() {
    const zone = document.getElementById('liste');
    if (!objectifs.length) {
      zone.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty">Aucun objectif. Clique sur "Nouvel objectif" pour commencer.</div></div>';
      return;
    }
    zone.innerHTML = objectifs.map(o => {
      const pct = o.valeurCible > 0 ? Math.min(100, (Utils.nombre(o.valeurActuelle) / o.valeurCible) * 100) : 0;
      const cls = pct >= 100 ? 'pos' : (pct >= 50 ? '' : 'warn');
      return '<div class="card">' +
        '<div class="row" style="margin-bottom:8px">' +
          '<div>' +
            '<div class="card-title">' + Utils.escapeHtml(o.nom) + '</div>' +
            '<div class="card-sub">' + o.type + ' - ' + o.categorie + '</div>' +
          '</div>' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-sm btn-ghost" data-edit="' + o.id + '">Modifier</button>' +
          '<button class="btn btn-sm btn-ghost" data-del="' + o.id + '">x</button>' +
        '</div>' +
        '<div class="progress"><div class="progress-bar ' + cls + '" style="width:' + pct.toFixed(1) + '%"></div></div>' +
        '<div class="row" style="margin-top:8px;justify-content:space-between;font-size:12px;color:var(--text-3)">' +
          '<span>' + Utils.formatNombre(o.valeurActuelle || 0, 2) + ' / ' + Utils.formatNombre(o.valeurCible, 2) + ' ' + (o.unite || '') + '</span>' +
          '<span>' + pct.toFixed(0) + ' %</span>' +
        '</div>' +
        (o.dateDebut || o.dateFin ? '<div class="text-xs muted" style="margin-top:4px">' + (o.dateDebut ? Utils.formatDate(o.dateDebut) : '') + ' ' + (o.dateFin ? 'a ' + Utils.formatDate(o.dateFin) : '') + '</div>' : '') +
        '</div>';
    }).join('');

    zone.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await Notif.confirmer('Supprimer cet objectif ?')) return;
        await Donnees.supprimerObjectif(b.dataset.del);
        location.reload();
      };
    });
    zone.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => ouvrirModal(objectifs.find(o => o.id === b.dataset.edit));
    });
  }

  function ouvrirModal(o) {
    const isEdit = !!o;
    o = o || { nom: '', type: 'Hebdomadaire', categorie: 'PERFORMANCE', valeurCible: 0, unite: 'R', dateDebut: '', dateFin: '', valeurActuelle: 0 };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header"><div class="modal-title">' + (isEdit ? 'Modifier' : 'Nouvel') + ' objectif</div></div>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Nom</label><input class="input" id="o-nom" value="' + Utils.escapeHtml(o.nom) + '"></div>' +
            '<div class="form-group"><label class="form-label">Type</label><select class="select" id="o-type">' + CONFIG.TYPES_OBJECTIFS.map(t => '<option ' + (t===o.type?'selected':'') + '>' + t + '</option>').join('') + '</select></div>' +
            '<div class="form-group"><label class="form-label">Categorie</label><select class="select" id="o-cat">' + CONFIG.CATEGORIES_OBJECTIFS.map(c => '<option ' + (c===o.categorie?'selected':'') + '>' + c + '</option>').join('') + '</select></div>' +
            '<div class="form-group"><label class="form-label">Valeur cible</label><input type="number" step="any" class="input" id="o-cible" value="' + o.valeurCible + '"></div>' +
            '<div class="form-group"><label class="form-label">Unite</label><input class="input" id="o-unite" value="' + Utils.escapeHtml(o.unite || '') + '" placeholder="R, $, %, trades..."></div>' +
            '<div class="form-group"><label class="form-label">Valeur actuelle</label><input type="number" step="any" class="input" id="o-actuelle" value="' + (o.valeurActuelle || 0) + '"></div>' +
            '<div class="form-group"><label class="form-label">Date debut</label><input type="date" class="input" id="o-deb" value="' + (o.dateDebut||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Date fin</label><input type="date" class="input" id="o-fin" value="' + (o.dateFin||'') + '"></div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="o-annuler">Annuler</button>' +
          '<button class="btn btn-primary" id="o-save">Enregistrer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#o-annuler').onclick = () => overlay.remove();
    overlay.querySelector('#o-save').onclick = async () => {
      const data = {
        id: o.id,
        nom: overlay.querySelector('#o-nom').value.trim(),
        type: overlay.querySelector('#o-type').value,
        categorie: overlay.querySelector('#o-cat').value,
        valeurCible: Utils.nombre(overlay.querySelector('#o-cible').value),
        unite: overlay.querySelector('#o-unite').value.trim(),
        valeurActuelle: Utils.nombre(overlay.querySelector('#o-actuelle').value),
        dateDebut: overlay.querySelector('#o-deb').value,
        dateFin: overlay.querySelector('#o-fin').value
      };
      if (!data.nom) return Notif.erreur('Nom obligatoire.');
      if (data.valeurCible <= 0) return Notif.erreur('Valeur cible positive requise.');
      if (isEdit) await Donnees.majObjectif(data);
      else await Donnees.ajouterObjectif(data);
      overlay.remove();
      location.reload();
    };
  }

  document.getElementById('btn-new').onclick = () => ouvrirModal(null);
  rendreListe();
});