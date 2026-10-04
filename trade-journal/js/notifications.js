/* ============================================================
   NOTIFICATIONS - Toasts et modales de confirmation
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Duree d'affichage ajustee
   ============================================================ */
const Notif = {
  conteneur() {
    let c = document.querySelector('.notifs');
    if (!c) {
      c = document.createElement('div');
      c.className = 'notifs';
      document.body.appendChild(c);
    }
    return c;
  },

  afficher(message, type = 'info', duree = 3900) {
    const n = document.createElement('div');
    n.className = 'notif ' + type;
    n.textContent = message;
    this.conteneur().appendChild(n);
    setTimeout(() => {
      n.style.transition = 'opacity 0.3s, transform 0.3s';
      n.style.opacity = '0';
      n.style.transform = 'translateX(20px)';
      setTimeout(() => n.remove(), 350);
    }, duree);
  },

  succes(m) { this.afficher(m, 'success'); },
  erreur(m) { this.afficher(m, 'error', 5000); },
  warn(m) { this.afficher(m, 'warn'); },
  info(m) { this.afficher(m, 'info'); },

  confirmer(message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay open';
      overlay.innerHTML =
        '<div class="modal" style="max-width:420px">' +
        '<div class="modal-header"><div class="modal-title">Confirmation</div></div>' +
        '<div class="modal-body">' + Utils.escapeHtml(message) + '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn" data-non>Annuler</button>' +
        '<button class="btn btn-danger" data-oui>Confirmer</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('[data-non]').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('[data-oui]').onclick = () => { overlay.remove(); resolve(true); };
    });
  }
};