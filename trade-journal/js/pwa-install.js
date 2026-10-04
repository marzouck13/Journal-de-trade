/* ============================================================
   PWA-INSTALL - Installation PWA (bannière + bouton sidebar)
   ------------------------------------------------------------
   Version : 2.1
   Derniere mise a jour : Masquage auto une fois installe

   Ameliorations v2.1 :
   - Persistance de l'etat "installe" dans localStorage
   - Detection via navigator.getInstalledRelatedApps()
   - Masquage automatique du bouton apres installation
   - Verification a chaque retour sur l'onglet
   - Le bouton ne s'affiche que si l'installation est possible

   Fonctionnalites :
   - Detecte beforeinstallprompt (Chrome, Edge, Samsung)
   - Banniere custom pour iOS Safari (Partager -> ecran accueil)
   - Bouton permanent dans la sidebar
   - Diagnostic complet en console
   ============================================================ */
(function () {
  'use strict';

  const CLE_REFUS = 'tj_pwa_refus';
  const CLE_INSTALLE = 'tj_pwa_installe';
  const DUREE_REFUS_MS = 30 * 24 * 60 * 60 * 1000;

  /* ==========================================================
     DIAGNOSTIC
     ========================================================== */
  const DIAG = {
    protocole: location.protocol,
    host: location.hostname,
    estHTTPS: location.protocol === 'https:',
    estLocalhost: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    estFile: location.protocol === 'file:',
    estStandalone: window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
      || window.navigator.standalone === true,
    supportSW: 'serviceWorker' in navigator,
    supportBIP: 'onbeforeinstallprompt' in window,
    userAgent: navigator.userAgent,
    estIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    estAndroid: /Android/i.test(navigator.userAgent)
  };

  if (DIAG.estFile) {
    console.warn('[PWA] Application ouverte en file:// - installation impossible');
    return;
  }

  /* ==========================================================
     ETAT D'INSTALLATION
     ==========================================================
     Trois sources d'information, dans l'ordre de fiabilite :
     1. Mode standalone (l'app tourne deja installee)
     2. Flag persistant dans localStorage (appinstalled)
     3. navigator.getInstalledRelatedApps() (Android Chrome)
     ========================================================== */
  let etatInstalle = false;

  function marquerInstalle() {
    etatInstalle = true;
    document.body.setAttribute('data-pwa-installed', 'true');
    try { localStorage.setItem(CLE_INSTALLE, '1'); } catch (e) {}
    supprimerBoutonSidebar();
    retirerBanniere();
    console.log('[PWA] Application marquee comme installee');
  }

  function estMarqueInstalle() {
    try { return localStorage.getItem(CLE_INSTALLE) === '1'; } catch (e) { return false; }
  }

  async function verifierViaAPI() {
    // navigator.getInstalledRelatedApps est disponible sur Chrome Android
    if (!navigator.getInstalledRelatedApps) return null;
    try {
      const apps = await navigator.getInstalledRelatedApps();
      return apps && apps.length > 0;
    } catch (e) {
      return null;
    }
  }

  async function verifierInstallation() {
    // Priorite 1 : mode standalone
    if (DIAG.estStandalone) {
      marquerInstalle();
      return true;
    }
    // Priorite 2 : flag localStorage
    if (estMarqueInstalle()) {
      marquerInstalle();
      return true;
    }
    // Priorite 3 : API navigateur
    const viaAPI = await verifierViaAPI();
    if (viaAPI === true) {
      marquerInstalle();
      return true;
    }
    return false;
  }

  /* ==========================================================
     DIAGNOSTIC CONSOLE
     ========================================================== */
  function afficherDiagnostic() {
    console.group('[PWA] Diagnostic');
    console.log('Protocole      :', DIAG.protocole);
    console.log('Host           :', DIAG.host);
    console.log('HTTPS requis   :', DIAG.estHTTPS || DIAG.estLocalhost ? 'OUI (valide)' : 'NON (invalide)');
    console.log('Service Worker :', DIAG.supportSW ? 'supporte' : 'non supporte');
    console.log('beforeinstall  :', DIAG.supportBIP ? 'supporte' : 'non supporte');
    console.log('iOS            :', DIAG.estIOS ? 'oui' : 'non');
    console.log('Android        :', DIAG.estAndroid ? 'oui' : 'non');
    console.log('Deja installe  :', DIAG.estStandalone ? 'oui (standalone)' : (estMarqueInstalle() ? 'oui (localStorage)' : 'non'));

    if (!DIAG.estHTTPS && !DIAG.estLocalhost) {
      console.warn('[PWA] ATTENTION : l\'installation PWA necessite HTTPS ou localhost.');
      console.warn('[PWA] Ton adresse actuelle : ' + location.origin);
    }
    console.groupEnd();
  }

  /* ==========================================================
     ETAT
     ========================================================== */
  let inviteDifferee = null;
  let banniereAffichee = false;
  let boutonSidebarCree = false;
  let installable = false;

  /* ==========================================================
     VERIFICATIONS
     ========================================================== */
  async function initialiser() {
    afficherDiagnostic();

    // Verifier si deja installe
    const installe = await verifierInstallation();
    if (installe) return;

    // Refus recent ?
    try {
      const refus = localStorage.getItem(CLE_REFUS);
      if (refus) {
        const ts = parseInt(refus, 10);
        if (!isNaN(ts) && (Date.now() - ts) < DUREE_REFUS_MS) {
          console.log('[PWA] Refus recent, pas de banniere automatique');
          // Le bouton sidebar peut quand meme etre cree si installation possible
          return;
        }
      }
    } catch (e) {}
  }

  initialiser();

  /* ==========================================================
     EVENEMENTS
     ========================================================== */
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt capture');
    e.preventDefault();
    inviteDifferee = e;
    installable = true;

    // Proposer la banniere apres un delai
    setTimeout(() => {
      if (!banniereAffichee && inviteDifferee && !etatInstalle) {
        afficherBanniere();
      }
    }, 5000);

    // Afficher le bouton dans la sidebar
    creerBoutonSidebar();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] appinstalled : installation reussie');
    inviteDifferee = null;
    marquerInstalle();
  });

  // iOS : pas de beforeinstallprompt, mais on peut quand meme
  // proposer le bouton car l'installation manuelle est possible
  if (DIAG.estIOS && !DIAG.estStandalone) {
    // Attendre un peu pour ne pas etre trop intrusif
    setTimeout(() => {
      if (!etatInstalle) creerBoutonSidebar();
    }, 3000);
  }

  /* ==========================================================
     BANNIERE
     ========================================================== */
  function cheminLogo() {
    return (location.pathname.includes('/pages/') ? '../' : '') + 'assets/icon-192.png';
  }

  function afficherBanniere() {
    if (banniereAffichee) return;
    if (document.getElementById('pwa-banniere')) return;
    if (etatInstalle) return;

    banniereAffichee = true;

    const banniere = document.createElement('div');
    banniere.id = 'pwa-banniere';
    banniere.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'background:var(--bg-3);border:1px solid var(--border-2);' +
      'padding:14px 18px;border-radius:12px;z-index:9998;' +
      'box-shadow:var(--shadow);display:flex;align-items:center;gap:14px;' +
      'font-size:13px;color:var(--text);max-width:calc(100vw - 32px);' +
      'flex-wrap:wrap;justify-content:center;';

    let boutons = '';
    if (DIAG.estIOS) {
      boutons =
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<button type="button" class="btn btn-sm" id="pwa-install-non">Plus tard</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="pwa-install-info">Comment faire ?</button>' +
        '</div>';
    } else {
      boutons =
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<button type="button" class="btn btn-sm" id="pwa-install-non">Plus tard</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="pwa-install-oui">Installer</button>' +
        '</div>';
    }

    banniere.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">' +
        '<div style="width:36px;height:36px;border-radius:8px;overflow:hidden;flex-shrink:0;">' +
          '<img src="' + cheminLogo() + '" alt="Trade Journal" style="width:100%;height:100%;object-fit:cover;display:block;">' +
        '</div>' +
        '<div style="line-height:1.4">' +
          '<div style="font-weight:600;color:var(--text)">Installer Trade Journal</div>' +
          '<div style="font-size:11px;color:var(--text-3)">Acces direct depuis ton ecran d\'accueil</div>' +
        '</div>' +
      '</div>' +
      boutons;

    document.body.appendChild(banniere);

    const btnOui = document.getElementById('pwa-install-oui');
    if (btnOui) {
      btnOui.onclick = async () => {
        if (!inviteDifferee) { afficherInstructionsManuelles(); return; }
        try {
          inviteDifferee.prompt();
          const choix = await inviteDifferee.userChoice;
          inviteDifferee = null;
          if (choix && choix.outcome === 'accepted') {
            retirerBanniere();
            // Note : appinstalled sera declenche par le navigateur
          } else {
            try { localStorage.setItem(CLE_REFUS, String(Date.now())); } catch (e) {}
            retirerBanniere();
          }
        } catch (e) {
          retirerBanniere();
        }
      };
    }

    const btnInfo = document.getElementById('pwa-install-info');
    if (btnInfo) btnInfo.onclick = afficherInstructionsManuelles;

    const btnNon = document.getElementById('pwa-install-non');
    if (btnNon) {
      btnNon.onclick = () => {
        try { localStorage.setItem(CLE_REFUS, String(Date.now())); } catch (e) {}
        retirerBanniere();
      };
    }
  }

  function retirerBanniere() {
    const b = document.getElementById('pwa-banniere');
    if (b) {
      b.style.transition = 'opacity 0.3s, transform 0.3s';
      b.style.opacity = '0';
      b.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => b.remove(), 320);
    }
    banniereAffichee = false;
  }

  /* ==========================================================
     MODALE D'INSTRUCTIONS
     ========================================================== */
  function afficherInstructionsManuelles() {
    // Ne pas afficher si deja installe
    if (etatInstalle) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'pwa-instructions-overlay';

    let contenu;
    if (DIAG.estIOS) {
      contenu =
        '<div style="font-size:14px;color:var(--text-2);line-height:1.7">' +
          '<p style="margin-bottom:16px">Pour installer Trade Journal sur ton iPhone ou iPad :</p>' +
          '<ol style="padding-left:20px;margin-bottom:16px;line-height:1.9">' +
            '<li>Ouvre cette page dans <strong>Safari</strong> (pas Chrome)</li>' +
            '<li>Appuie sur le bouton <strong>Partager</strong> ' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-3px;width:16px;height:16px;"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
              ' en bas de l\'ecran</li>' +
            '<li>Fais defiler et choisis <strong>Sur l\'ecran d\'accueil</strong></li>' +
            '<li>Appuie sur <strong>Ajouter</strong></li>' +
          '</ol>' +
          '<p style="color:var(--text-3);font-size:12px">L\'icone Trade Journal apparaitra sur ton ecran d\'accueil comme une application native.</p>' +
        '</div>';
    } else {
      contenu =
        '<div style="font-size:14px;color:var(--text-2);line-height:1.7">' +
          '<p style="margin-bottom:16px">Pour installer Trade Journal :</p>' +
          '<ol style="padding-left:20px;margin-bottom:16px;line-height:1.9">' +
            '<li>Ouvre le menu de ton navigateur (trois points en haut a droite)</li>' +
            '<li>Cherche <strong>Installer l\'application</strong> ou <strong>Ajouter a l\'ecran d\'accueil</strong></li>' +
            '<li>Confirme l\'installation</li>' +
          '</ol>' +
        '</div>';
    }

    overlay.innerHTML =
      '<div class="modal" style="max-width:440px">' +
        '<div class="modal-header">' +
          '<div class="modal-title">Installer Trade Journal</div>' +
        '</div>' +
        '<div class="modal-body">' + contenu + '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-primary" id="pwa-instructions-fermer">Compris</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.getElementById('pwa-instructions-fermer').onclick = () => {
      overlay.remove();
      try { localStorage.setItem(CLE_REFUS, String(Date.now())); } catch (e) {}
      retirerBanniere();
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ==========================================================
     BOUTON DANS LA SIDEBAR
     ========================================================== */
  function creerBoutonSidebar() {
    // Ne rien faire si deja installe
    if (etatInstalle) return;
    if (estMarqueInstalle()) return;
    if (DIAG.estStandalone) return;
    if (document.body.getAttribute('data-pwa-installed') === 'true') return;

    // Ne rien faire si le bouton existe deja
    if (document.getElementById('pwa-sidebar-btn')) return;

    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'pwa-sidebar-btn';
    btn.className = 'btn btn-primary';
    btn.style.cssText =
      'width:100%;justify-content:center;margin-bottom:12px;font-size:12px;' +
      'display:flex;align-items:center;gap:6px;';

    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">' +
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
        '<polyline points="7 10 12 15 17 10"/>' +
        '<line x1="12" y1="15" x2="12" y2="3"/>' +
      '</svg>' +
      'Installer l\'application';

    btn.onclick = async () => {
      if (etatInstalle) return;
      if (inviteDifferee) {
        try {
          inviteDifferee.prompt();
          const choix = await inviteDifferee.userChoice;
          inviteDifferee = null;
          if (choix && choix.outcome === 'accepted') {
            // appinstalled va nous notifier
            supprimerBoutonSidebar();
          }
        } catch (e) {}
      } else {
        afficherInstructionsManuelles();
      }
    };

    const footerParent = footer.parentNode;
    if (footerParent) {
      footerParent.insertBefore(btn, footer);
      boutonSidebarCree = true;
    }
  }

  function supprimerBoutonSidebar() {
    const btn = document.getElementById('pwa-sidebar-btn');
    if (btn) {
      btn.style.transition = 'opacity 0.2s ease';
      btn.style.opacity = '0';
      setTimeout(() => btn.remove(), 220);
    }
    boutonSidebarCree = false;
  }

  /* ==========================================================
     DETECTION AU RETOUR SUR L'ONGLET
     ========================================================== */
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    if (etatInstalle) return;

    const installe = await verifierInstallation();
    if (installe) {
      supprimerBoutonSidebar();
      retirerBanniere();
    }
  });

  /* ==========================================================
     VERIFICATION PERIODIQUE
     ==========================================================
     Toutes les 10 secondes, on verifie si l'app est installee.
     Utile pour le cas ou l'utilisateur installe l'app en
     arriere-plan et revient sur l'onglet sans rechargement.
     ========================================================== */
  setInterval(async () => {
    if (etatInstalle) return;
    const installe = await verifierInstallation();
    if (installe) {
      supprimerBoutonSidebar();
      retirerBanniere();
    }
  }, 10000);

  /* ==========================================================
     CREATION DU BOUTON APRES LE DOM
     ========================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      // Verifier l'etat avant de creer
      const installe = await verifierInstallation();
      if (installe) return;

      // Creer le bouton si installable ou iOS
      if (installable || DIAG.estIOS) {
        creerBoutonSidebar();
      }
    }, 500);
  });

  /* ==========================================================
     OBSERVATEUR DE MUTATION
     ==========================================================
     Si la sidebar est rerendue, on recree le bouton.
     Mais seulement si l'app n'est pas installee.
     ========================================================== */
  const observer = new MutationObserver(async () => {
    if (etatInstalle) return;
    if (estMarqueInstalle()) return;
    if (document.body.getAttribute('data-pwa-installed') === 'true') return;
    if (!installable && !DIAG.estIOS) return;

    if (!document.getElementById('pwa-sidebar-btn') && document.querySelector('.sidebar-footer')) {
      creerBoutonSidebar();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

})();