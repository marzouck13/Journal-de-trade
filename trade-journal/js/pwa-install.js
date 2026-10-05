/* ============================================================
   PWA-INSTALL - Installation PWA (banniere + bouton sidebar)
   ------------------------------------------------------------
   Version : 2.3
   Derniere mise a jour : Emission evenement pwa-installe

   Ameliorations v2.3 :
   - Emission de l'evenement "pwa-installe" quand l'app est
     detectee comme installee (utilise par navigation.js)
   - Fiabilisation de la capture de beforeinstallprompt
   - Diagnostic complet en console
   ============================================================ */
(function () {
  'use strict';

  const CLE_REFUS = 'tj_pwa_refus';
  const CLE_INSTALLE = 'tj_pwa_installe';
  const DUREE_REFUS_MS = 30 * 24 * 60 * 60 * 1000;

  // ---- Exposer deferredPrompt globalement pour la page installer.html ----
  window.deferredPrompt = null;

  // ---- Capture immediate de l'evenement ----
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Evenement beforeinstallprompt capture.');
    e.preventDefault();
    window.deferredPrompt = e;

    // Declencher l'UI si les fonctions sont pretes
    if (typeof window.afficherInterfaceInstallation === 'function') {
      window.afficherInterfaceInstallation();
    }
  });

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

  // ---- Etat d'installation ----
  let etatInstalle = false;

  function marquerInstalle() {
    if (etatInstalle) return;
    etatInstalle = true;
    document.body.setAttribute('data-pwa-installed', 'true');
    try { localStorage.setItem(CLE_INSTALLE, '1'); } catch (e) {}
    supprimerBoutonSidebar();
    retirerBanniere();

    // Emettre un evenement pour les autres scripts
    try {
      window.dispatchEvent(new CustomEvent('pwa-installe'));
    } catch (e) {}

    console.log('[PWA] Application marquee comme installee');
  }

  function estMarqueInstalle() {
    try { return localStorage.getItem(CLE_INSTALLE) === '1'; } catch (e) { return false; }
  }

  async function verifierViaAPI() {
    if (!navigator.getInstalledRelatedApps) return null;
    try {
      const apps = await navigator.getInstalledRelatedApps();
      return apps && apps.length > 0;
    } catch (e) {
      return null;
    }
  }

  async function verifierInstallation() {
    if (DIAG.estStandalone) { marquerInstalle(); return true; }
    if (estMarqueInstalle()) { marquerInstalle(); return true; }
    const viaAPI = await verifierViaAPI();
    if (viaAPI === true) { marquerInstalle(); return true; }
    return false;
  }

  function afficherDiagnostic() {
    console.group('[PWA] Diagnostic');
    console.log('Protocole      :', DIAG.protocole);
    console.log('Host           :', DIAG.host);
    console.log('HTTPS          :', DIAG.estHTTPS ? 'OUI (valide)' : 'NON (invalide)');
    console.log('Service Worker :', DIAG.supportSW ? 'supporte' : 'non supporte');
    console.log('beforeinstall  :', DIAG.supportBIP ? 'supporte' : 'non supporte');
    console.log('iOS            :', DIAG.estIOS ? 'oui' : 'non');
    console.log('Android        :', DIAG.estAndroid ? 'oui' : 'non');
    console.log('Deja installe  :', DIAG.estStandalone ? 'oui (standalone)' : (estMarqueInstalle() ? 'oui (localStorage)' : 'non'));
    console.groupEnd();
  }

  let banniereAffichee = false;
  let boutonSidebarCree = false;

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
        if (!window.deferredPrompt) { afficherInstructionsManuelles(); return; }
        try {
          window.deferredPrompt.prompt();
          const choix = await window.deferredPrompt.userChoice;
          window.deferredPrompt = null;
          if (choix && choix.outcome === 'accepted') {
            retirerBanniere();
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

  function afficherInstructionsManuelles() {
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
            '<li>Appuie sur le bouton <strong>Partager</strong> en bas de l\'ecran</li>' +
            '<li>Fais defiler et choisis <strong>Sur l\'ecran d\'accueil</strong></li>' +
            '<li>Appuie sur <strong>Ajouter</strong></li>' +
          '</ol>' +
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
          '<div style="padding:12px;background:var(--bg-3);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text-3);line-height:1.6">' +
            'Consulte la page <a href="installer.html" style="color:var(--accent)">Installer</a> pour des instructions detaillees selon ton appareil.' +
          '</div>' +
        '</div>';
    }

    overlay.innerHTML =
      '<div class="modal" style="max-width:440px">' +
        '<div class="modal-header">' +
          '<div class="modal-title">Installer Trade Journal</div>' +
        '</div>' +
        '<div class="modal-body">' + contenu + '</div>' +
        '<div class="modal-footer">' +
          '<a href="installer.html" class="btn">Voir les instructions</a>' +
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

  function creerBoutonSidebar() {
    if (etatInstalle) return;
    if (estMarqueInstalle()) return;
    if (DIAG.estStandalone) return;
    if (document.body.getAttribute('data-pwa-installed') === 'true') return;
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
      if (window.deferredPrompt) {
        try {
          window.deferredPrompt.prompt();
          const choix = await window.deferredPrompt.userChoice;
          window.deferredPrompt = null;
          if (choix && choix.outcome === 'accepted') {
            supprimerBoutonSidebar();
          }
        } catch (e) {}
      } else {
        // Rediriger vers la page installer.html
        const base = location.pathname.includes('/pages/') ? '' : 'pages/';
        location.href = base + 'installer.html';
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

  window.afficherInterfaceInstallation = function() {
    if (etatInstalle) return;
    if (estMarqueInstalle()) return;

    if (!banniereAffichee && window.deferredPrompt) {
      setTimeout(() => {
        if (!banniereAffichee && window.deferredPrompt && !etatInstalle) {
          afficherBanniere();
        }
      }, 3000);
    }

    creerBoutonSidebar();
  };

  async function initialiser() {
    afficherDiagnostic();

    const installe = await verifierInstallation();
    if (installe) return;

    try {
      const refus = localStorage.getItem(CLE_REFUS);
      if (refus) {
        const ts = parseInt(refus, 10);
        if (!isNaN(ts) && (Date.now() - ts) < DUREE_REFUS_MS) {
          console.log('[PWA] Refus recent, pas de banniere automatique');
          if (window.deferredPrompt) { creerBoutonSidebar(); }
          return;
        }
      }
    } catch (e) {}

    if (window.deferredPrompt) {
      window.afficherInterfaceInstallation();
    }
  }

  initialiser();

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] appinstalled : installation reussie');
    window.deferredPrompt = null;
    marquerInstalle();
  });

  if (DIAG.estIOS && !DIAG.estStandalone) {
    setTimeout(() => {
      if (!etatInstalle) creerBoutonSidebar();
    }, 3000);
  }

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || etatInstalle) return;
    const installe = await verifierInstallation();
    if (installe) { supprimerBoutonSidebar(); retirerBanniere(); }
  });

  setInterval(async () => {
    if (etatInstalle) return;
    const installe = await verifierInstallation();
    if (installe) { supprimerBoutonSidebar(); retirerBanniere(); }
  }, 10000);

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      const installe = await verifierInstallation();
      if (installe) return;
      if (window.deferredPrompt || DIAG.estIOS) {
        creerBoutonSidebar();
      }
    }, 500);
  });

  const observer = new MutationObserver(async () => {
    if (etatInstalle || estMarqueInstalle()) return;
    if (document.body.getAttribute('data-pwa-installed') === 'true') return;
    if (!window.deferredPrompt && !DIAG.estIOS) return;
    if (!document.getElementById('pwa-sidebar-btn') && document.querySelector('.sidebar-footer')) {
      creerBoutonSidebar();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

})();