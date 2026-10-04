/* ============================================================
   NAVIGATION - Sidebar et topbar partagees
   ------------------------------------------------------------
   Version : 4.2
   Derniere mise a jour : Ajout du lien Soutenir

   Ameliorations v4.2 :
   - Ajout du lien "Soutenir" dans la section Informations
   - Icone cadeau
   ============================================================ */
const Navigation = (() => {
  const base = (() => {
    const p = location.pathname;
    return p.includes('/pages/') ? '../' : '';
  })();

  const Sessions = (() => {
    const PLAGES = [
      { nom: 'Overlap',     label: 'Londres + New York', debut: 13, fin: 17 },
      { nom: 'Londres',     label: 'Londres',            debut: 8,  fin: 13 },
      { nom: 'New York',    label: 'New York',           debut: 17, fin: 22 },
      { nom: 'Asie',        label: 'Tokyo (Asie)',       debut: 0,  fin: 8  }
    ];
    const VILLES = [
      { nom: 'Tokyo',    tz: 'Asia/Tokyo',       ouvre: 0,  ferme: 8  },
      { nom: 'Londres',  tz: 'Europe/London',    ouvre: 8,  ferme: 17 },
      { nom: 'New York', tz: 'America/New_York', ouvre: 13, ferme: 22 }
    ];
    function heureUTC() {
      const d = new Date();
      return d.getUTCHours() + d.getUTCMinutes() / 60;
    }
    function sessionActive() {
      const h = heureUTC();
      for (const p of PLAGES) if (h >= p.debut && h < p.fin) return p.nom;
      return 'Hors session';
    }
    function sessionActiveLabel() {
      const nom = sessionActive();
      const p = PLAGES.find(x => x.nom === nom);
      return p ? p.label : 'Hors session';
    }
    function prochaineSession() {
      const h = heureUTC();
      const futures = PLAGES.filter(p => p.debut > h).sort((a, b) => a.debut - b.debut);
      if (futures.length) {
        const p = futures[0];
        return { nom: p.label, dansMinutes: Math.round((p.debut - h) * 60) };
      }
      return { nom: 'Tokyo (Asie)', dansMinutes: Math.round((24 - h) * 60) };
    }
    function heureVille(tz) {
      try {
        return new Intl.DateTimeFormat('fr-FR', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date());
      } catch (e) { return '--:--'; }
    }
    function heureLocale() {
      try {
        return new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date());
      } catch (e) { return '--:--'; }
    }
    function minutesAvantOuverture(v) {
      const h = heureUTC();
      if (h >= v.ouvre && h < v.ferme) return 0;
      let diff = v.ouvre - h;
      if (diff < 0) diff += 24;
      return Math.round(diff * 60);
    }
    function villeOuverte(v) {
      const h = heureUTC();
      return h >= v.ouvre && h < v.ferme;
    }
    function formatMinutes(m) {
      if (m <= 0) return 'maintenant';
      if (m < 60) return 'dans ' + m + ' min';
      const h = Math.floor(m / 60);
      const min = m % 60;
      if (min === 0) return 'dans ' + h + 'h';
      return 'dans ' + h + 'h' + String(min).padStart(2, '0');
    }
    return {
      sessionActive, sessionActiveLabel, prochaineSession,
      heureVille, heureLocale, villeOuverte, minutesAvantOuverture,
      formatMinutes, VILLES, PLAGES
    };
  })();

  const ICONS = {
    dashboard:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    journal:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h13l3 3v13H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    plus:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    calendar:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    chart:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 4 4 5-7"/></svg>',
    eco:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h12"/><circle cx="17" cy="18" r="3"/><path d="M17 15v-2M17 23v-2"/></svg>',
    stats:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
    assets:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
    setup:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M6 12h12M9 18h6"/></svg>',
    risk:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 20h20L12 2z"/><path d="M12 10v4M12 18h.01"/></svg>',
    discipline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    psycho:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3a7 7 0 00-7 7c0 4 3 6 3 9h8V3H9zM15 3v16h3c0-2 3-4 3-9a7 7 0 00-6-7z"/></svg>',
    evolution:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    target:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    trophy:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0V4zM5 4H3v3a3 3 0 003 3M19 4h2v3a3 3 0 01-3 3"/></svg>',
    notes:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 3h12l4 4v14H4z"/><path d="M8 12h8M8 16h8M8 8h5"/></svg>',
    lessons:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 10v6c0 1 3 3 6 3s6-2 6-3v-6"/></svg>',
    report:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l4 4v16H4V2h4z"/><path d="M14 2v4h4M8 12h8M8 16h8M8 8h3"/></svg>',
    settings:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    info:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
    heart:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    gift:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>'
  };

  const SECTIONS = [
    { titre: 'Principal', liens: [
      { id: 'dashboard',  label: 'Dashboard',      href: 'index.html',               icon: 'dashboard' },
      { id: 'journal',    label: 'Journal',        href: 'pages/journal.html',       icon: 'journal' },
      { id: 'nouveau',    label: 'Nouveau trade',  href: 'pages/nouveau-trade.html', icon: 'plus' },
      { id: 'calendrier', label: 'Calendrier',     href: 'pages/calendrier.html',    icon: 'calendar' }
    ]},
    { titre: 'Analyse', liens: [
      { id: 'graphiques',     label: 'Graphiques',     href: 'pages/graphiques.html',            icon: 'chart' },
      { id: 'calendrier-eco', label: 'Calendrier Eco', href: 'pages/calendrier-economique.html', icon: 'eco' },
      { id: 'stats',          label: 'Statistiques',   href: 'pages/statistiques.html',          icon: 'stats' },
      { id: 'actifs',         label: 'Actifs',         href: 'pages/actifs.html',                icon: 'assets' },
      { id: 'setups',         label: 'Setups',         href: 'pages/setups.html',                icon: 'setup' },
      { id: 'risque',         label: 'Risque',         href: 'pages/risque.html',                icon: 'risk' },
      { id: 'discipline',     label: 'Discipline',     href: 'pages/discipline.html',            icon: 'discipline' },
      { id: 'psycho',         label: 'Psychologie',    href: 'pages/psychologie.html',           icon: 'psycho' }
    ]},
    { titre: 'Progression', liens: [
      { id: 'evolution',   label: 'Evolution',     href: 'pages/evolution.html',     icon: 'evolution' },
      { id: 'objectifs',   label: 'Objectifs',     href: 'pages/objectifs.html',     icon: 'target' },
      { id: 'challenges',  label: 'Challenges',    href: 'pages/challenges.html',    icon: 'trophy' }
    ]},
    { titre: 'Reflexion', liens: [
      { id: 'notes',       label: 'Notes',         href: 'pages/notes.html',         icon: 'notes' },
      { id: 'lecons',      label: 'Lecons',        href: 'pages/lecons.html',        icon: 'lessons' },
      { id: 'rapports',    label: 'Rapports',      href: 'pages/rapports.html',      icon: 'report' }
    ]},
    { titre: 'Systeme', liens: [
      { id: 'parametres',  label: 'Parametres',    href: 'pages/parametres.html',    icon: 'settings' }
    ]},
    { titre: 'Informations', liens: [
      { id: 'a-propos',        label: 'A propos',         href: 'pages/a-propos.html',        icon: 'heart' },
      { id: 'soutenir',        label: 'Soutenir',         href: 'pages/soutenir.html',        icon: 'gift' },
      { id: 'support',         label: 'Support',          href: 'pages/support.html',         icon: 'info' },
      { id: 'cgu',             label: 'Conditions',       href: 'pages/cgu.html',             icon: 'report' },
      { id: 'confidentialite', label: 'Confidentialite',  href: 'pages/confidentialite.html', icon: 'report' }
    ]}
  ];

  function pageActive() {
    const p = location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'dashboard', '': 'dashboard',
      'journal.html': 'journal', 'nouveau-trade.html': 'nouveau', 'trade.html': 'journal',
      'calendrier.html': 'calendrier',
      'graphiques.html': 'graphiques', 'calendrier-economique.html': 'calendrier-eco',
      'statistiques.html': 'stats', 'actifs.html': 'actifs', 'setups.html': 'setups',
      'risque.html': 'risque', 'discipline.html': 'discipline', 'psychologie.html': 'psycho',
      'evolution.html': 'evolution', 'objectifs.html': 'objectifs', 'challenges.html': 'challenges',
      'notes.html': 'notes', 'lecons.html': 'lecons', 'rapports.html': 'rapports',
      'parametres.html': 'parametres',
      'a-propos.html': 'a-propos',
      'soutenir.html': 'soutenir',
      'support.html': 'support', 'cgu.html': 'cgu', 'confidentialite.html': 'confidentialite'
    };
    return map[p] || '';
  }

  function initSidebarResponsive() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (!sidebar || !toggle) return;

    if (!document.getElementById('sidebar-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'sidebar-backdrop';
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', fermerSidebar);
    }

    function fermerSidebar() {
      sidebar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('sidebar-open');
    }

    function ouvrirSidebar() {
      sidebar.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('sidebar-open');
    }

    toggle.onclick = (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('open')) fermerSidebar();
      else ouvrirSidebar();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) fermerSidebar();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && sidebar.classList.contains('open')) fermerSidebar();
    });
  }

  function rendre() {
    const active = pageActive();
    let html = '<div class="sidebar-brand">' +
      '<div class="sidebar-brand-logo">' +
        '<img src="' + base + 'assets/icon-192.png" alt="Trade Journal">' +
      '</div>' +
      '<div>' +
        '<div class="sidebar-brand-text">Trade Journal</div>' +
        '<div class="sidebar-brand-sub">Journal personnel</div>' +
      '</div>' +
    '</div>' +
    '<nav class="sidebar-nav">';

    for (const section of SECTIONS) {
      html += '<div class="nav-section-title">' + section.titre + '</div>';
      for (const l of section.liens) {
        const cls = 'nav-link' + (l.id === active ? ' active' : '');
        html += '<a class="' + cls + '" href="' + base + l.href + '">' + (ICONS[l.icon] || '') + '<span>' + l.label + '</span></a>';
      }
    }
    html += '</nav>' +
      '<div class="sidebar-footer">' +
        '<div style="margin-bottom:8px">Bonne concentration</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:10px">' +
          '<a href="' + base + 'pages/a-propos.html" style="color:var(--text-3)">A propos</a>' +
          '<a href="' + base + 'pages/soutenir.html" style="color:var(--text-3)">Soutenir</a>' +
          '<a href="' + base + 'pages/cgu.html" style="color:var(--text-3)">CGU</a>' +
          '<a href="' + base + 'pages/confidentialite.html" style="color:var(--text-3)">Confidentialite</a>' +
          '<a href="' + base + 'pages/support.html" style="color:var(--text-3)">Support</a>' +
        '</div>' +
      '</div>';

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.innerHTML = html;

    const toggle = document.querySelector('.menu-toggle');
    if (toggle) {
      toggle.setAttribute('aria-label', 'Ouvrir le menu');
      toggle.setAttribute('aria-expanded', 'false');
    }

    document.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          document.querySelector('.sidebar')?.classList.remove('open');
          document.body.classList.remove('sidebar-open');
        }
      });
    });

    initSidebarResponsive();

    const actions = document.querySelector('.topbar-actions');

    if (actions && !actions.querySelector('.session-badge')) {
      const sb = document.createElement('button');
      sb.type = 'button';
      sb.className = 'session-badge';
      sb.id = 'session-badge';
      sb.setAttribute('aria-label', 'Sessions de trading');
      sb.innerHTML = '<span class="session-dot"></span><span class="session-label">...</span>';
      actions.insertBefore(sb, actions.firstChild);
      sb.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopoverSessions();
      });
      majBadgeSession();
      setInterval(majBadgeSession, 30000);
    }

    if (!document.__sessionsListener) {
      document.__sessionsListener = true;

      document.addEventListener('click', (e) => {
        const pop = document.getElementById('session-popover');
        if (!pop || !pop.classList.contains('open')) return;
        if (e.target.closest('#session-badge')) return;
        if (e.target.closest('#session-popover')) return;
        if (e.target.closest('#session-popover-backdrop')) return;
        fermerPopoverSessions();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fermerPopoverSessions();
      });

      window.addEventListener('resize', () => {
        fermerPopoverSessions();
      });

      window.addEventListener('pagehide', () => {
        fermerPopoverSessions();
      });
    }
  }

  function majBadgeSession() {
    const b = document.getElementById('session-badge');
    if (!b) return;
    const s = Sessions.sessionActive();
    const label = b.querySelector('.session-label');
    if (label) label.textContent = s;
    b.classList.remove('ouvert', 'overlap', 'ferme');
    if (s === 'Overlap') b.classList.add('overlap');
    else if (s === 'Hors session') b.classList.add('ferme');
    else b.classList.add('ouvert');
  }

  function fermerPopoverSessions() {
    const pop = document.getElementById('session-popover');
    const back = document.getElementById('session-popover-backdrop');
    if (pop) pop.classList.remove('open');
    if (back) back.classList.remove('open');
    document.body.classList.remove('session-popover-ouvert');
  }

  function togglePopoverSessions() {
    const pop = document.getElementById('session-popover');

    if (pop && pop.classList.contains('open')) {
      fermerPopoverSessions();
      return;
    }

    let back = document.getElementById('session-popover-backdrop');
    if (!back) {
      back = document.createElement('div');
      back.id = 'session-popover-backdrop';
      back.className = 'session-popover-backdrop';
      back.addEventListener('click', fermerPopoverSessions);
      document.body.appendChild(back);
    }

    if (!pop) {
      const p = document.createElement('div');
      p.id = 'session-popover';
      p.className = 'session-popover';
      p.addEventListener('click', (e) => e.stopPropagation());
      document.body.appendChild(p);
    }

    const elPop = document.getElementById('session-popover');

    const badge = document.getElementById('session-badge');
    const estMobile = window.innerWidth <= 768;

    if (estMobile) {
      elPop.style.position = 'fixed';
      elPop.style.top = '60px';
      elPop.style.left = '8px';
      elPop.style.right = '8px';
      elPop.style.maxWidth = 'none';
      elPop.style.width = 'auto';
      elPop.style.maxHeight = 'calc(100dvh - 76px)';
      elPop.style.overflowY = 'auto';
    } else {
      elPop.style.position = 'fixed';
      elPop.style.top = 'auto';
      elPop.style.left = 'auto';
      elPop.style.right = 'auto';
      elPop.style.maxWidth = '';
      elPop.style.width = '';
      elPop.style.maxHeight = '';
      elPop.style.overflowY = '';

      if (badge) {
        const rect = badge.getBoundingClientRect();
        elPop.style.top = (rect.bottom + 8) + 'px';
        elPop.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
      }
    }

    const actifLabel = Sessions.sessionActiveLabel();
    const prochaine = Sessions.prochaineSession();
    const heureLocaleUser = Sessions.heureLocale();

    let html = '';

    html += '<div class="session-popover-header">' +
      '<div class="session-popover-title">Marches ouverts</div>' +
      '<button type="button" class="session-popover-fermer" id="session-popover-fermer" aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">' +
          '<line x1="18" y1="6" x2="6" y2="18"/>' +
          '<line x1="6" y1="6" x2="18" y2="18"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

    html += '<div style="font-size:10px;color:var(--text-3);margin-bottom:10px;line-height:1.5">' +
      'Une session est active quand le marche est <strong>ouvert</strong> a cette heure-ci.' +
      '</div>';

    for (const v of Sessions.VILLES) {
      const ouvert = Sessions.villeOuverte(v);
      const heure = Sessions.heureVille(v.tz);
      const minAvant = Sessions.minutesAvantOuverture(v);
      let statusText = '';
      let statusClass = '';
      if (ouvert) { statusText = 'OUVERT'; statusClass = 'ouvert'; }
      else { statusText = 'FERME - ouvre ' + Sessions.formatMinutes(minAvant); statusClass = 'ferme'; }

      html += '<div class="session-row ' + statusClass + '">' +
        '<span class="nom">' +
          '<span class="pastille"></span>' +
          '<span style="display:flex;flex-direction:column;line-height:1.3">' +
            '<span style="font-weight:600;color:var(--text)">' + v.nom + '</span>' +
            '<span style="font-size:10px;color:var(--text-3)">' + statusText + '</span>' +
          '</span>' +
        '</span>' +
        '<span class="heure">' + heure + '</span>' +
        '</div>';
    }

    html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">' +
      '<span style="color:var(--text-3)">Session active</span>' +
      '<strong style="color:var(--text)">' + actifLabel + '</strong>' +
      '</div>';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">' +
      '<span style="color:var(--text-3)">Prochaine</span>' +
      '<strong style="color:var(--text)">' + prochaine.nom + ' ' + Sessions.formatMinutes(prochaine.dansMinutes) + '</strong>' +
      '</div>';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;border-top:1px dashed var(--border);margin-top:6px">' +
      '<span style="color:var(--text-3)">Ton heure locale</span>' +
      '<strong style="color:var(--text);font-family:var(--mono)">' + heureLocaleUser + '</strong>' +
      '</div>';
    html += '</div>';

    if (estMobile) {
      html += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">' +
        '<button type="button" class="btn" style="width:100%;justify-content:center" id="session-popover-fermer-bas">' +
        'Fermer' +
        '</button>' +
        '</div>';
    }

    elPop.innerHTML = html;
    elPop.classList.add('open');
    back.classList.add('open');
    document.body.classList.add('session-popover-ouvert');

    const btnX = document.getElementById('session-popover-fermer');
    if (btnX) btnX.addEventListener('click', fermerPopoverSessions);
    const btnBas = document.getElementById('session-popover-fermer-bas');
    if (btnBas) btnBas.addEventListener('click', fermerPopoverSessions);
  }

  return {
    rendre, base,
    initSidebarResponsive,
    fermerPopoverSessions,
    sessionActive: Sessions.sessionActive,
    sessionActiveLabel: Sessions.sessionActiveLabel,
    prochaineSession: Sessions.prochaineSession,
    heureVille: Sessions.heureVille,
    heureLocale: Sessions.heureLocale
  };
})();