/* ============================================================
   NOTES - Notes libres datees
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  let notes = await Donnees.toutesLesNotes();
  let recherche = '';

  function rendre() {
    const filtrees = recherche
      ? notes.filter(n => (n.titre + ' ' + n.contenu).toLowerCase().includes(recherche.toLowerCase()))
      : notes;
    const zone = document.getElementById('liste');
    if (!filtrees.length) {
      zone.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="empty">Aucune note.</div></div>';
      return;
    }
    zone.innerHTML = filtrees.map(n =>
      '<div class="card">' +
        '<div class="row">' +
          '<div>' +
            '<div class="card-title">' + Utils.escapeHtml(n.titre || 'Sans titre') + '</div>' +
            '<div class="card-sub">' + Utils.formatDate(n.date) + '</div>' +
          '</div>' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-sm btn-ghost" data-edit="' + n.id + '">Modifier</button>' +
          '<button class="btn btn-sm btn-ghost" data-del="' + n.id + '">x</button>' +
        '</div>' +
        '<div class="text-sm" style="margin-top:10px;white-space:pre-wrap">' + Utils.escapeHtml(n.contenu || '') + '</div>' +
      '</div>'
    ).join('');

    zone.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        if (!await Notif.confirmer('Supprimer cette note ?')) return;
        await Donnees.supprimerNote(b.dataset.del);
        notes = await Donnees.toutesLesNotes();
        rendre();
      };
    });
    zone.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => ouvrirModal(notes.find(n => n.id === b.dataset.edit));
    });
  }

  function ouvrirModal(n) {
    const isEdit = !!n;
    n = n || { titre: '', contenu: '', date: Utils.aujourdhuiISO() };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header"><div class="modal-title">' + (isEdit ? 'Modifier' : 'Nouvelle') + ' note</div></div>' +
        '<div class="modal-body">' +
          '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Titre</label><input class="input" id="n-titre" value="' + Utils.escapeHtml(n.titre||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Date</label><input type="date" class="input" id="n-date" value="' + n.date + '"></div>' +
          '</div>' +
          '<div class="form-group" style="margin-top:14px"><label class="form-label">Contenu</label><textarea class="textarea" id="n-contenu" style="min-height:180px">' + Utils.escapeHtml(n.contenu||'') + '</textarea></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="n-annuler">Annuler</button>' +
          '<button class="btn btn-primary" id="n-save">Enregistrer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#n-annuler').onclick = () => overlay.remove();
    overlay.querySelector('#n-save').onclick = async () => {
      const data = {
        id: n.id,
        titre: overlay.querySelector('#n-titre').value.trim(),
        contenu: overlay.querySelector('#n-contenu').value,
        date: overlay.querySelector('#n-date').value
      };
      if (isEdit) await Donnees.majNote(data);
      else await Donnees.ajouterNote(data);
      overlay.remove();
      notes = await Donnees.toutesLesNotes();
      rendre();
    };
  }

  document.getElementById('btn-new').onclick = () => ouvrirModal(null);
  document.getElementById('recherche').addEventListener('input', e => {
    recherche = e.target.value; rendre();
  });
  rendre();
});