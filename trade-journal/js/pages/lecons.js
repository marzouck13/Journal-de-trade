/* ============================================================
   LECONS - Post-mortem et erreurs taguees
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  let lecons = await Donnees.toutesLesLecons();
  let recherche = '', filtreTag = '';

  const selTag = document.getElementById('filtre-tag');
  selTag.innerHTML = '<option value="">Tous les tags</option>' + CONFIG.TAGS_LECONS.map(t => '<option>' + t + '</option>').join('');

  function rendre() {
    const filtrees = lecons.filter(l => {
      if (filtreTag && !(l.tags || []).includes(filtreTag)) return false;
      if (recherche) {
        const hay = [l.titre, l.contexte, l.erreur, l.cause, l.consequence, l.lecon, l.actionCorrective].join(' ').toLowerCase();
        if (!hay.includes(recherche.toLowerCase())) return false;
      }
      return true;
    });

    const zone = document.getElementById('liste');
    if (!filtrees.length) {
      zone.innerHTML = '<div class="card"><div class="empty">Aucune lecon.</div></div>';
      return;
    }
    zone.innerHTML = filtrees.map(l =>
      '<div class="card" style="margin-bottom:14px">' +
        '<div class="row">' +
          '<div>' +
            '<div class="card-title">' + Utils.escapeHtml(l.titre || 'Sans titre') + '</div>' +
            '<div class="card-sub">' + Utils.formatDate(l.date) + ' ' + (l.tags||[]).map(t => '<span class="badge badge-info" style="margin-left:4px">' + t + '</span>').join('') + '</div>' +
          '</div>' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-sm btn-ghost" data-edit="' + l.id + '">Modifier</button>' +
          '<button class="btn btn-sm btn-ghost" data-del="' + l.id + '">x</button>' +
        '</div>' +
        '<div style="margin-top:12px;font-size:13px;color:var(--text-2)">' +
          (l.contexte ? '<div><strong>Contexte :</strong> ' + Utils.escapeHtml(l.contexte) + '</div>' : '') +
          (l.erreur ? '<div><strong>Erreur :</strong> ' + Utils.escapeHtml(l.erreur) + '</div>' : '') +
          (l.cause ? '<div><strong>Cause :</strong> ' + Utils.escapeHtml(l.cause) + '</div>' : '') +
          (l.consequence ? '<div><strong>Consequence :</strong> ' + Utils.escapeHtml(l.consequence) + '</div>' : '') +
          (l.lecon ? '<div><strong>Lecon :</strong> ' + Utils.escapeHtml(l.lecon) + '</div>' : '') +
          (l.actionCorrective ? '<div><strong>Action :</strong> ' + Utils.escapeHtml(l.actionCorrective) + '</div>' : '') +
        '</div>' +
      '</div>'
    ).join('');

    zone.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await Notif.confirmer('Supprimer cette lecon ?')) return;
        await Donnees.supprimerLecon(b.dataset.del);
        lecons = await Donnees.toutesLesLecons();
        rendre();
      };
    });
    zone.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => ouvrirModal(lecons.find(l => l.id === b.dataset.edit));
    });
  }

  function ouvrirModal(l) {
    const isEdit = !!l;
    l = l || { titre: '', contexte: '', erreur: '', cause: '', consequence: '', lecon: '', actionCorrective: '', tags: [], date: Utils.aujourdhuiISO() };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header"><div class="modal-title">' + (isEdit ? 'Modifier' : 'Nouvelle') + ' lecon</div></div>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Titre</label><input class="input" id="l-titre" value="' + Utils.escapeHtml(l.titre||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Date</label><input type="date" class="input" id="l-date" value="' + l.date + '"></div>' +
          '</div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Tags (Ctrl+clic pour multiple)</label>' +
            '<select class="select" id="l-tags" multiple size="4">' + CONFIG.TAGS_LECONS.map(t => '<option ' + ((l.tags||[]).includes(t)?'selected':'') + '>' + t + '</option>').join('') + '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Contexte</label><textarea class="textarea" id="l-contexte">' + Utils.escapeHtml(l.contexte||'') + '</textarea></div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Erreur</label><textarea class="textarea" id="l-erreur">' + Utils.escapeHtml(l.erreur||'') + '</textarea></div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Cause</label><textarea class="textarea" id="l-cause">' + Utils.escapeHtml(l.cause||'') + '</textarea></div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Consequence</label><textarea class="textarea" id="l-consequence">' + Utils.escapeHtml(l.consequence||'') + '</textarea></div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Lecon</label><textarea class="textarea" id="l-lecon">' + Utils.escapeHtml(l.lecon||'') + '</textarea></div>' +
          '<div class="form-group" style="margin-top:12px"><label class="form-label">Action corrective</label><textarea class="textarea" id="l-action">' + Utils.escapeHtml(l.actionCorrective||'') + '</textarea></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="l-annuler">Annuler</button>' +
          '<button class="btn btn-primary" id="l-save">Enregistrer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#l-annuler').onclick = () => overlay.remove();
    overlay.querySelector('#l-save').onclick = async () => {
      const tags = Array.from(overlay.querySelector('#l-tags').selectedOptions).map(o => o.value);
      const data = {
        id: l.id, titre: overlay.querySelector('#l-titre').value.trim(),
        date: overlay.querySelector('#l-date').value, tags,
        contexte: overlay.querySelector('#l-contexte').value,
        erreur: overlay.querySelector('#l-erreur').value,
        cause: overlay.querySelector('#l-cause').value,
        consequence: overlay.querySelector('#l-consequence').value,
        lecon: overlay.querySelector('#l-lecon').value,
        actionCorrective: overlay.querySelector('#l-action').value
      };
      if (!data.titre) return Notif.erreur('Titre obligatoire.');
      if (isEdit) await Donnees.majLecon(data); else await Donnees.ajouterLecon(data);
      overlay.remove();
      lecons = await Donnees.toutesLesLecons();
      rendre();
    };
  }

  document.getElementById('btn-new').onclick = () => ouvrirModal(null);
  document.getElementById('recherche').addEventListener('input', e => { recherche = e.target.value; rendre(); });
  selTag.addEventListener('change', e => { filtreTag = e.target.value; rendre(); });
  rendre();
});