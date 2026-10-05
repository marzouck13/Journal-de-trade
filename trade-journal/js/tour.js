/* ============================================================
   TOUR - Visite guidee multi-pages pour les nouveaux utilisateurs
   ------------------------------------------------------------
   Version : 3.2
   Derniere mise a jour : Delai auto porte a 1 seconde

   Chaque page dispose de sa propre visite guidee, affichee une
   seule fois lors de sa premiere visite. Flag par page dans
   localStorage (tj_tour_vu_<page>).

   NOUVEAU v3.2 :
     - Delai avant auto-demarrage reduit a 1 seconde (au lieu de 1.5s)

   NOUVEAU v3.1 :
     - Detection de la sidebar cachee PAR SA POSITION REELLE
     - Hooks avant() / apres() peuvent etre async (Promise)
     - Le tour ouvre la sidebar automatiquement a l'etape de
       presentation, attend la transition, puis la referme
     - Sur mobile, quand la sidebar est ouverte par le tour, le
       tooltip s'affiche en bas de l'ecran pour ne pas la masquer

   API publique :
     Tour.demarrer()          Lance la visite de la page courante
     Tour.arreter()           Ferme la visite en cours
     Tour.reinitialiser()     Reinitialise TOUTES les visites
     Tour.reinitialiserPage() Reinitialise la page courante
     Tour.estVu()             true si la visite de la page est vue
     Tour.pageId()            Identifiant de la page courante
     Tour.pages()             Liste des pages couvertes
   ============================================================ */
const Tour = (() => {
  'use strict';

  const PREFIXE_VU = 'tj_tour_vu_';
  const CLE_RELANCER = 'tj_tour_relancer';
  const DELAI_AUTO = 1000; // <-- modifie (etait 1500)
  const DUREE_TRANSITION_SIDEBAR = 320; // ms, un peu plus que la transition CSS
  const Z_BLOCKER = 10000;
  const Z_HOLE = 10001;
  const Z_TOOLTIP = 10002;
  const MARGE = 16;

  /* ==========================================================
     Identifiant de la page courante
     ========================================================== */
  function pageId() {
    const fichier = location.pathname.split('/').pop() || 'index.html';
    return fichier.replace(/\.html$/, '') || 'index';
  }

  function cleVuPourPage(id) {
    return PREFIXE_VU + (id || pageId());
  }

  /* ==========================================================
     Etat de la sidebar (detection dynamique)
     ========================================================== */
  function getSidebar() {
    return document.querySelector('.sidebar');
  }

  function sidebarEstCachee() {
    const sidebar = getSidebar();
    if (!sidebar) return false;
    const r = sidebar.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return true;
    if (r.right <= 0 || r.left >= window.innerWidth) return true;
    return false;
  }

  function ouvrirSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.add('open');
    document.body.classList.add('sidebar-open');
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function fermerSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  /* ==========================================================
     Visites guidees par page
     ========================================================== */
  const TOURS = {

    /* ---------- Dashboard ---------- */
    'index': [
      { selecteur: null,
        titre: 'Bienvenue dans Trade Journal',
        texte: 'Ce court guide te presente l\'essentiel en moins d\'une minute. Tu peux le passer a tout moment avec le bouton en bas.' },
      { selecteur: '.sidebar',
        avant: async () => {
          if (sidebarEstCachee()) {
            ouvrirSidebar();
            sidebarOuverteParTour = true;
            await new Promise(r => setTimeout(r, DUREE_TRANSITION_SIDEBAR));
          }
        },
        apres: async () => {
          if (sidebarOuverteParTour) {
            fermerSidebar();
            sidebarOuverteParTour = false;
            await new Promise(r => setTimeout(r, 100));
          }
        },
        titre: 'Ta navigation principale',
        texte: 'Voici ton menu principal. Toutes les pages sont regroupees ici par categorie : journal, analyse, progression, reflexion et parametres. Chaque section sert un objectif precis.' },
      { selecteur: '.topbar-actions a[href*="nouveau-trade"], .topbar-actions .btn-action-topbar',
        titre: 'Enregistrer un trade',
        texte: 'C\'est ici que commence ton journal. Chaque trade enregistre alimente automatiquement tes statistiques, tes graphiques et tes analyses.' },
      { selecteur: '#kpi-principal', attendre: '#kpi-principal .kpi',
        titre: 'Tes indicateurs cles',
        texte: 'Capital, P&L, winrate, drawdown, expectancy... tout est calcule en temps reel a partir de tes trades. Survole un label pour voir son explication.' },
      { selecteur: '#mon-univers', attendre: '#mon-univers .asset-card, #mon-univers .card',
        titre: 'Ton univers de trading',
        texte: 'Les actifs que tu suis, avec leurs performances individuelles. Tu configures ta liste librement dans Parametres.' },
      { selecteur: '.content .grid-2',
        titre: 'Analyse visuelle',
        texte: 'Courbe de capital, P&L cumule, drawdown, distribution en R. Chaque page d\'analyse approfondit un aspect de ta pratique.' },
      { selecteur: '.topbar-actions', attendre: '#session-badge',
        titre: 'Sessions et confort',
        texte: 'Suis en direct les sessions de marche ouvertes (Tokyo, Londres, New York) et bascule entre theme sombre et clair selon ton environnement.' },
      { selecteur: null,
        titre: 'Tu es pret',
        texte: 'Ton journal t\'appartient. Commence par enregistrer un trade, puis explore les pages d\'analyse a ton rythme. Bonne progression.' }
    ],

    /* ---------- Journal ---------- */
    'journal': [
      { selecteur: null,
        titre: 'Ton journal des trades',
        texte: 'Tous tes trades enregistres apparaissent ici. Cette page te sert a retrouver, filtrer et analyser ton historique complet.' },
      { selecteur: '#f-recherche',
        titre: 'Recherche rapide',
        texte: 'Tape un mot-cle (commentaire, setup, actif...) pour retrouver instantanement un trade precis.' },
      { selecteur: '.form-grid',
        titre: 'Filtres avances',
        texte: 'Combine plusieurs criteres : actif, direction, setup, statut, respect du plan, periode. Ideal pour analyser un sous-ensemble de tes trades.' },
      { selecteur: '.table-wrap',
        titre: 'Tableau et tri',
        texte: 'Clique sur un en-tete de colonne pour trier. Clique sur "Voir" a droite d\'une ligne pour ouvrir le detail complet du trade.' }
    ],

    /* ---------- Nouveau trade ---------- */
    'nouveau-trade': [
      { selecteur: null,
        titre: 'Enregistrer un nouveau trade',
        texte: 'Plus tu remplis de champs, plus tes analyses seront riches. Les champs marques d\'un asterisque sont obligatoires.' },
      { selecteur: 'fieldset:nth-of-type(1)',
        titre: 'Informations generales',
        texte: 'Date, actif, direction, session, timeframe, heures d\'entree et de sortie. C\'est le socle de tout trade bien journalise.' },
      { selecteur: 'fieldset:nth-of-type(3)',
        titre: 'Execution et niveaux',
        texte: 'Prix d\'entree, stop loss, take profit, prix de sortie, lot. Le R:R planifie se calcule automatiquement a partir de ces valeurs.' },
      { selecteur: 'fieldset:nth-of-type(4)',
        titre: 'Risque et resultat',
        texte: 'Le risque en $ et le resultat en R sont calcules automatiquement a partir du capital et du risque %. Tu n\'as qu\'a saisir le resultat net.' },
      { selecteur: 'fieldset:nth-of-type(6)',
        titre: 'Captures d\'ecran',
        texte: 'Ajoute une capture avant et apres chaque trade. Elles sont compressees automatiquement et stockees sur ton appareil, jamais ailleurs.' }
    ],

    /* ---------- Calendrier ---------- */
    'calendrier': [
      { selecteur: null,
        titre: 'Ton calendrier de performance',
        texte: 'Visualise ton activite mois par mois. Chaque case coloree represente une journee de trading.' },
      { selecteur: '.card .row',
        titre: 'Naviguer dans le temps',
        texte: 'Utilise les fleches pour changer de mois, ou clique sur "Aujourd\'hui" pour revenir a la date courante.' },
      { selecteur: '#cal-body',
        titre: 'Tes journees',
        texte: 'Vert = journee positive, rouge = journee negative. Le P&L et le R total du jour s\'affichent directement dans chaque case.' },
      { selecteur: '#detail-jour',
        titre: 'Detail d\'une journee',
        texte: 'Clique sur une case pour voir tous les trades de cette journee en un coup d\'oeil.' }
    ],

    /* ---------- Graphiques ---------- */
    'graphiques': [
      { selecteur: null,
        titre: 'Graphiques TradingView',
        texte: 'Analyse technique en direct, integree a Trade Journal. Choisis un actif, un intervalle, et explore le marche.' },
      { selecteur: '#tv-recherche',
        titre: 'Rechercher un actif',
        texte: 'Tape un symbole (XAUUSD, BTCUSD, EURUSD, AAPL...) puis selectionne une suggestion. Le graphique se charge automatiquement.' },
      { selecteur: '#tv-intervals',
        titre: 'Changer d\'intervalle',
        texte: 'Du M1 (1 minute) au W1 (1 semaine), adapte l\'echelle temporelle a ton style de trading.' },
      { selecteur: '#tv-chart',
        titre: 'Ton graphique',
        texte: 'Ajoute des indicateurs en cliquant sur l\'icone fx dans la barre laterale du graphique. Ta configuration est sauvegardee.' }
    ],

    /* ---------- Calendrier economique ---------- */
    'calendrier-economique': [
      { selecteur: null,
        titre: 'Calendrier economique',
        texte: 'Suis les evenements macro qui impactent les marches : NFP, FOMC, CPI... Un outil pour anticiper la volatilite.' },
      { selecteur: '#eco-recherche',
        titre: 'Filtrer par actif',
        texte: 'Choisis un actif pour voir les evenements qui le concernent directement, en plus des evenements mondiaux majeurs.' },
      { selecteur: '#eco-container',
        titre: 'Evenements en temps reel',
        texte: 'Les evenements a fort impact sont toujours affiches. Les evenements specifiques a ton actif viennent s\'ajouter automatiquement.' }
    ],

    /* ---------- Statistiques ---------- */
    'statistiques': [
      { selecteur: null,
        titre: 'Tes statistiques globales',
        texte: 'Tous tes chiffres cles reunis sur une seule page. Analyse globale ou ciblee, a toi de choisir.' },
      { selecteur: '.card .row',
        titre: 'Filtrer par periode',
        texte: 'Bascule entre Tout, Mois en cours, Semaine ou Aujourd\'hui pour recalculer instantanement tes statistiques sur la periode choisie.' },
      { selecteur: '#kpis',
        titre: 'Tes indicateurs',
        texte: 'Winrate, profit factor, expectancy, R moyen, gain/perte moyens... Chaque indicateur eclaire une facette de ta performance.' },
      { selecteur: '.content .grid-2',
        titre: 'Analyses visuelles',
        texte: 'Resultats mensuels, distribution en R, performance par actif, R moyen par setup. Autant d\'angles pour comprendre ce qui marche.' }
    ],

    /* ---------- Actifs ---------- */
    'actifs': [
      { selecteur: null,
        titre: 'Analyse par actif',
        texte: 'Compare les performances de chaque actif de ton univers. Vois lequel te reussit le mieux.' },
      { selecteur: '#cartes',
        titre: 'Tes actifs',
        texte: 'Chaque carte resume un actif : P&L, nombre de trades, winrate. Un clic te mene au detail.' },
      { selecteur: '.chart-box',
        titre: 'Graphiques comparatifs',
        texte: 'P&L et winrate cote a cote pour chaque actif. Utile pour identifier tes points forts.' },
      { selecteur: '.table-wrap',
        titre: 'Tableau comparatif',
        texte: 'Statistiques detaillees par actif : expectancy, profit factor, drawdown max, meilleur et pire jour.' }
    ],

    /* ---------- Setups ---------- */
    'setups': [
      { selecteur: null,
        titre: 'Analyse de tes setups',
        texte: 'Chaque setup se comporte differemment. Cette page te montre lesquels fonctionnent vraiment pour toi.' },
      { selecteur: '#btn-new',
        titre: 'Creer un setup',
        texte: 'Ajoute tes setups personnels ici. Ils apparaitront ensuite dans le formulaire de saisie des trades.' },
      { selecteur: '.table-wrap',
        titre: 'Performance par setup',
        texte: 'Compare tes setups : nombre de trades, winrate, P&L, R moyen, expectancy, profit factor. Les meilleurs ressortent immediatement.' }
    ],

    /* ---------- Risque ---------- */
    'risque': [
      { selecteur: null,
        titre: 'Analyse du risque',
        texte: 'Ta gestion du risque est la base d\'une progression durable. Cette page te montre ou tu en es par rapport a tes limites personnelles.' },
      { selecteur: '#alertes',
        titre: 'Alertes automatiques',
        texte: 'Des que tu depasses une de tes limites (risque max, drawdown, nombre de trades par jour), une alerte s\'affiche ici.' },
      { selecteur: '#kpis',
        titre: 'Tes chiffres de risque',
        texte: 'Risque moyen, risque max observe, drawdown actuel et maximal, series de pertes. Compare-les en permanence a tes limites.' },
      { selecteur: '.content .grid-2',
        titre: 'Visualisation dans le temps',
        texte: 'Risque par trade et risque cumule par jour. Repere d\'un coup d\'oeil les periodes ou tu as pris trop de risque.' }
    ],

    /* ---------- Discipline ---------- */
    'discipline': [
      { selecteur: null,
        titre: 'Ton score de discipline',
        texte: 'Un chiffre unique qui resume ton respect du plan, ta capacite a eviter les erreurs, et le respect de tes limites de risque.' },
      { selecteur: '#score',
        titre: 'Le score sur 100',
        texte: 'Calcule a partir de tes trades reels. Plus tu es discipliné, plus le score monte. Simple, mesurable, honnete.' },
      { selecteur: '#kpis',
        titre: 'Le detail',
        texte: 'Respect du plan, trades sans erreur, respect du risque max. Chaque facteur pese dans le score final.' }
    ],

    /* ---------- Psychologie ---------- */
    'psychologie': [
      { selecteur: null,
        titre: 'Psychologie du trading',
        texte: 'Ton etat mental influence tes decisions. Cette page t\'aide a voir des patterns entre ton mental et tes resultats.' },
      { selecteur: '.chart-box',
        titre: 'Resultat par etat mental',
        texte: 'Compare tes performances selon ton etat mental (calme, stresse, euphorique...). Les correlations peuvent surprendre.' },
      { selecteur: '.table-wrap',
        titre: 'Detail par etat',
        texte: 'Nombre de trades, R total, P&L et winrate pour chaque etat mental. Une facon concrete de savoir quand tu performes le mieux.' }
    ],

    /* ---------- Evolution ---------- */
    'evolution': [
      { selecteur: null,
        titre: 'Evolution de ton capital',
        texte: 'La vue long terme de ta progression. Capital, P&L cumule et drawdown dans le temps.' },
      { selecteur: '#kpis',
        titre: 'Tes indicateurs de progression',
        texte: 'Capital de depart et actuel, performance globale, pic historique, drawdown actuel et maximal.' },
      { selecteur: '.content .card',
        titre: 'Courbes detaillees',
        texte: 'Chaque courbe raconte une histoire : la croissance de ton capital, ton P&L cumule, et les phases de drawdown.' }
    ],

    /* ---------- Objectifs ---------- */
    'objectifs': [
      { selecteur: null,
        titre: 'Tes objectifs personnels',
        texte: 'Fixer des objectifs clairs structure ta progression. Suis-les ici, sans pression, sans promesse de resultat.' },
      { selecteur: '#objectif-principal',
        titre: 'Objectif financier principal',
        texte: 'Definis un cap concret : objectif de capital a atteindre, avec date cible. La progression est calculee automatiquement.' },
      { selecteur: '.content > .card:nth-of-type(2)',
        titre: 'Ce qui depend de toi / pas de toi',
        texte: 'Rappel utile : tu ne controles pas les marches. Tu controles ta discipline, ton risque, ta qualite d\'execution.' },
      { selecteur: '#liste',
        titre: 'Tes objectifs secondaires',
        texte: 'Ajoute autant d\'objectifs que tu veux : performance, risque, discipline, apprentissage. Chacun a sa propre progression.' }
    ],

    /* ---------- Challenges ---------- */
    'challenges': [
      { selecteur: null,
        titre: 'Challenges structures',
        texte: 'Un challenge est un objectif borne dans le temps, avec des criteres precis. Parfait pour tester une strategie.' },
      { selecteur: '#btn-new',
        titre: 'Creer un challenge',
        texte: 'Choisis une periode, des objectifs (financier, R, risque max, drawdown). Le suivi est automatique.' },
      { selecteur: '#content',
        titre: 'Suivi automatique',
        texte: 'Chaque challenge affiche sa progression en temps reel : P&L, R total, respect du risque, drawdown maitrise.' }
    ],

    /* ---------- Notes ---------- */
    'notes': [
      { selecteur: null,
        titre: 'Tes notes libres',
        texte: 'Un espace pour reflechir, planifier, documenter ta strategie. Aucun format impose.' },
      { selecteur: '#btn-new',
        titre: 'Nouvelle note',
        texte: 'Ajoute une note avec un titre, une date, et un contenu libre. Utile pour tes plans, tes idees, tes debriefs.' },
      { selecteur: '#liste',
        titre: 'Tes notes',
        texte: 'Toutes tes notes apparaissent ici. Utilise la recherche pour retrouver rapidement une idee.' }
    ],

    /* ---------- Lecons ---------- */
    'lecons': [
      { selecteur: null,
        titre: 'Lecons et post-mortem',
        texte: 'Capitalise sur chaque experience. Cette page t\'aide a transformer tes erreurs en apprentissages durables.' },
      { selecteur: '#btn-new',
        titre: 'Ajouter une lecon',
        texte: 'Contexte, erreur, cause, consequence, lecon, action corrective. Une trame structuree pour apprendre vraiment.' },
      { selecteur: '#liste',
        titre: 'Tes lecons taguees',
        texte: 'Classe tes lecons par theme (timing, risque, discipline...). Filtre pour retrouver toutes tes notes sur un sujet.' }
    ],

    /* ---------- Rapports ---------- */
    'rapports': [
      { selecteur: null,
        titre: 'Rapports automatiques',
        texte: 'Genere des bilans structures sur une journee ou un mois entier. Ideal pour prendre du recul regulierement.' },
      { selecteur: '.content .row',
        titre: 'Choisir la periode',
        texte: 'Bilan du jour pour un point rapide, rapport mensuel pour une vue d\'ensemble plus strategique.' },
      { selecteur: '#rapport',
        titre: 'Ton rapport',
        texte: 'Statistiques, meilleurs et pires moments, erreurs notees, et zones pour ecrire ce qui a fonctionne ou doit etre ameliore.' }
    ],

    /* ---------- Parametres ---------- */
    'parametres': [
      { selecteur: null,
        titre: 'Tes parametres',
        texte: 'Toute la configuration de ton journal en une seule page. Prends le temps de bien la remplir au depart.' },
      { selecteur: '.theme-picker',
        titre: 'Theme sombre ou clair',
        texte: 'Choisis l\'apparence qui te convient le mieux selon ton environnement. Tu peux basculer a tout moment.' },
      { selecteur: '#liste-actifs',
        titre: 'Ton univers de trading',
        texte: 'Choisis librement les actifs que tu trades. Ils apparaitront partout dans l\'application : dashboard, analyses, formulaires.' },
      { selecteur: '.content > .card:nth-last-of-type(3)',
        titre: 'Sauvegarde',
        texte: 'Exporte regulierement tes donnees dans un dossier de ton ordinateur. Tes donnees restent sur ton appareil, c\'est ta responsabilite de les sauvegarder.' }
    ]

  };

  /* ==========================================================
     Etat interne
     ========================================================== */
  let etapesCourantes = [];
  let idx = -1;
  let actif = false;
  let blockerEl = null;
  let holeEl = null;
  let tooltipEl = null;
  let cibleEl = null;
  let cibleRect = null;
  let onScrollRaf = null;
  let listenerKeydown = null;
  let sidebarOuverteParTour = false;

  /* ==========================================================
     Utilitaires
     ========================================================== */
  function estPageRacine() {
    return !location.pathname.includes('/pages/');
  }

  function cheminLogo() {
    return (estPageRacine() ? '' : '../') + 'assets/icon-192.png';
  }

  function dejaVu(id) {
    try { return localStorage.getItem(cleVuPourPage(id)) === '1'; } catch (e) { return true; }
  }

  function marquerVu(id) {
    try { localStorage.setItem(cleVuPourPage(id), '1'); } catch (e) {}
  }

  function lireFlagRelance() {
    try {
      if (localStorage.getItem(CLE_RELANCER) === '1') {
        localStorage.removeItem(CLE_RELANCER);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function etapesDeLaPage() {
    const id = pageId();
    return TOURS[id] || null;
  }

  function estVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (parseFloat(s.opacity) === 0) return false;
    if (r.right <= 0 || r.left >= window.innerWidth) return false;
    return true;
  }

  function estFixe(el) {
    let node = el;
    while (node && node !== document.body) {
      const s = window.getComputedStyle(node);
      if (s.position === 'fixed' || s.position === 'sticky') return true;
      node = node.parentElement;
    }
    return false;
  }

  function attendre(selector, timeout) {
    timeout = timeout || 3000;
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) { resolve(el); return; }
      const debut = Date.now();
      const interval = setInterval(() => {
        const e = document.querySelector(selector);
        if (e) {
          clearInterval(interval);
          resolve(e);
        } else if (Date.now() - debut > timeout) {
          clearInterval(interval);
          reject(new Error('Timeout: ' + selector));
        }
      }, 100);
    });
  }

  function trouverCible(etape) {
    if (!etape.selecteur) return null;
    const parties = etape.selecteur.split(',').map(s => s.trim());
    for (const p of parties) {
      try {
        const el = document.querySelector(p);
        if (el && estVisible(el)) return el;
      } catch (e) {}
    }
    for (const p of parties) {
      try {
        const el = document.querySelector(p);
        if (el) return el;
      } catch (e) {}
    }
    return null;
  }

  function scrollVersCible(el) {
    if (!el) return Promise.resolve();
    if (estFixe(el)) return Promise.resolve();

    const r = el.getBoundingClientRect();
    const H = window.innerHeight;
    const W = window.innerWidth;
    const estDansViewport = r.top >= 100 && r.bottom <= H - 100 && r.left >= 0 && r.right <= W;
    if (estDansViewport) return Promise.resolve();

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } catch (e) {
      el.scrollIntoView();
    }
    return new Promise(res => setTimeout(res, 450));
  }

  function attendreBody() {
    return new Promise(resolve => {
      if (document.body) { resolve(); return; }
      const iv = setInterval(() => {
        if (document.body) {
          clearInterval(iv);
          resolve();
        }
      }, 50);
    });
  }

  async function executerHook(hook) {
    if (typeof hook !== 'function') return;
    try {
      await hook();
    } catch (e) {
      console.warn('[Tour] Hook error :', e && e.message);
    }
  }

  /* ==========================================================
     Injection du CSS
     ========================================================== */
  function injecterCss() {
    if (document.getElementById('tj-tour-style')) return;
    const style = document.createElement('style');
    style.id = 'tj-tour-style';
    style.textContent = `
      .tj-tour-blocker {
        position: fixed;
        inset: 0;
        z-index: ${Z_BLOCKER};
        background: transparent;
        pointer-events: auto;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .tj-tour-blocker.actif { opacity: 1; }

      .tj-tour-hole {
        position: fixed;
        z-index: ${Z_HOLE};
        pointer-events: none;
        border-radius: var(--radius-sm, 8px);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
        outline: 2px solid var(--accent, #4f8cff);
        outline-offset: 0;
        transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease, opacity 0.2s;
        opacity: 0;
      }
      .tj-tour-hole.actif { opacity: 1; }

      .tj-tour-tooltip {
        position: fixed;
        z-index: ${Z_TOOLTIP};
        background: var(--bg-2, #121722);
        border: 1px solid var(--border-2, #2d364a);
        border-radius: var(--radius, 12px);
        box-shadow: var(--shadow, 0 8px 24px rgba(0,0,0,0.25));
        padding: 20px 20px 24px;
        max-width: 380px;
        min-width: 300px;
        color: var(--text, #e6ebf5);
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.25s ease, transform 0.25s ease;
        pointer-events: auto;
        font-family: inherit;
      }
      .tj-tour-tooltip.actif {
        opacity: 1;
        transform: translateY(0);
      }

      .tj-tour-tooltip.mode-bas {
        left: ${MARGE}px !important;
        right: ${MARGE}px !important;
        top: auto !important;
        bottom: ${MARGE}px !important;
        max-width: none !important;
        min-width: 0 !important;
        width: auto !important;
      }

      .tj-tour-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 12px;
      }

      .tj-tour-progress {
        font-size: 11px;
        color: var(--text-3, #6b7488);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }

      .tj-tour-fermer {
        background: transparent;
        border: none;
        color: var(--text-3, #6b7488);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: grid;
        place-items: center;
        transition: background 0.15s, color 0.15s;
      }
      .tj-tour-fermer:hover {
        background: var(--bg-3, #171d2c);
        color: var(--text, #e6ebf5);
      }

      .tj-tour-titre {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text, #e6ebf5);
        letter-spacing: -0.01em;
      }

      .tj-tour-texte {
        font-size: 13px;
        line-height: 1.65;
        color: var(--text-2, #97a1b6);
        margin-bottom: 18px;
      }

      .tj-tour-actions {
        display: flex;
        gap: 8px;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }

      .tj-tour-pass {
        background: transparent;
        border: none;
        color: var(--text-3, #6b7488);
        font-size: 12px;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 6px;
        font-family: inherit;
        transition: background 0.15s, color 0.15s;
      }
      .tj-tour-pass:hover {
        color: var(--text-2, #97a1b6);
        background: var(--bg-3, #171d2c);
      }

      .tj-tour-groupe {
        display: flex;
        gap: 6px;
      }

      .tj-tour-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 8px 14px;
        border-radius: var(--radius-sm, 8px);
        border: 1px solid var(--border-2, #2d364a);
        background: var(--bg-3, #171d2c);
        color: var(--text, #e6ebf5);
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, border-color 0.15s;
      }
      .tj-tour-btn:hover:not(:disabled) {
        background: var(--bg-4, #1f2637);
      }
      .tj-tour-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .tj-tour-btn-primaire {
        background: var(--accent, #4f8cff);
        border-color: var(--accent, #4f8cff);
        color: #fff;
      }
      .tj-tour-btn-primaire:hover:not(:disabled) {
        background: #3a76e8;
        border-color: #3a76e8;
      }

      .tj-tour-pied {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 16px;
        padding-left: 36px;
        padding-right: 36px;
        min-height: 24px;
      }

      .tj-tour-logo {
        position: absolute;
        left: 0;
        bottom: -4px;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        opacity: 0.65;
        pointer-events: none;
        user-select: none;
      }

      .tj-tour-pastilles {
        display: flex;
        gap: 5px;
        justify-content: center;
        align-items: center;
      }
      .tj-tour-pastille {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--bg-4, #1f2637);
        transition: background 0.2s, transform 0.2s;
      }
      .tj-tour-pastille.actif {
        background: var(--accent, #4f8cff);
        transform: scale(1.3);
      }
      .tj-tour-pastille.passe {
        background: var(--text-3, #6b7488);
      }

      @media (max-width: 768px) {
        .tj-tour-tooltip {
          max-width: calc(100vw - 24px);
          min-width: 0;
          padding: 18px 18px 22px;
        }
        .tj-tour-titre { font-size: 15px; }
        .tj-tour-texte { font-size: 12.5px; margin-bottom: 14px; }
        .tj-tour-actions { gap: 6px; }
        .tj-tour-btn {
          min-height: 42px;
          padding: 10px 16px;
          font-size: 13px;
        }
        .tj-tour-pass {
          min-height: 42px;
          padding: 10px 12px;
        }
        .tj-tour-fermer {
          min-width: 36px;
          min-height: 36px;
        }
        .tj-tour-logo { width: 24px; height: 24px; bottom: -2px; }
        .tj-tour-pied { padding-left: 32px; padding-right: 32px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ==========================================================
     Creation des elements
     ========================================================== */
  function creerElements() {
    if (blockerEl) return;

    blockerEl = document.createElement('div');
    blockerEl.className = 'tj-tour-blocker';
    blockerEl.setAttribute('aria-hidden', 'true');
    blockerEl.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(blockerEl);

    holeEl = document.createElement('div');
    holeEl.className = 'tj-tour-hole';
    holeEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(holeEl);

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tj-tour-tooltip';
    tooltipEl.setAttribute('role', 'dialog');
    tooltipEl.setAttribute('aria-label', 'Visite guidee');
    tooltipEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(tooltipEl);
  }

  function detruireElements() {
    if (blockerEl && blockerEl.parentNode) blockerEl.parentNode.removeChild(blockerEl);
    if (holeEl && holeEl.parentNode) holeEl.parentNode.removeChild(holeEl);
    if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
    blockerEl = null;
    holeEl = null;
    tooltipEl = null;
  }

  function cacherBannierePWA() {
    const b = document.getElementById('pwa-banniere');
    if (b) b.style.display = 'none';
  }

  function restaurerBannierePWA() {
    const b = document.getElementById('pwa-banniere');
    if (b) b.style.display = '';
  }

  /* ==========================================================
     Rendu du contenu du tooltip
     ========================================================== */
  function rendreTooltip(etape) {
    const total = etapesCourantes.length;
    const numero = idx + 1;
    const premiere = idx === 0;
    const derniere = idx === total - 1;

    let pastilles = '';
    for (let i = 0; i < total; i++) {
      let cls = 'tj-tour-pastille';
      if (i === idx) cls += ' actif';
      else if (i < idx) cls += ' passe';
      pastilles += '<span class="' + cls + '"></span>';
    }

    const btnPrec = premiere
      ? ''
      : '<button type="button" class="tj-tour-btn" data-action="prec">Precedent</button>';

    const btnSuiv = derniere
      ? '<button type="button" class="tj-tour-btn tj-tour-btn-primaire" data-action="fin">Terminer</button>'
      : '<button type="button" class="tj-tour-btn tj-tour-btn-primaire" data-action="suiv">Suivant</button>';

    tooltipEl.innerHTML =
      '<div class="tj-tour-header">' +
        '<span class="tj-tour-progress">' + numero + ' / ' + total + '</span>' +
        '<button type="button" class="tj-tour-fermer" data-action="fermer" aria-label="Fermer le guide">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="18" y1="6" x2="6" y2="18"/>' +
            '<line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="tj-tour-titre">' + etape.titre + '</div>' +
      '<div class="tj-tour-texte">' + etape.texte + '</div>' +
      '<div class="tj-tour-actions">' +
        '<button type="button" class="tj-tour-pass" data-action="passer">Passer le guide</button>' +
        '<div class="tj-tour-groupe">' +
          btnPrec +
          btnSuiv +
        '</div>' +
      '</div>' +
      '<div class="tj-tour-pied">' +
        '<img src="' + cheminLogo() + '" alt="" class="tj-tour-logo" aria-hidden="true">' +
        '<div class="tj-tour-pastilles">' + pastilles + '</div>' +
      '</div>';

    tooltipEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'suiv') suivant();
        else if (action === 'prec') precedent();
        else if (action === 'fin') terminer();
        else if (action === 'fermer' || action === 'passer') terminer();
      });
    });
  }

  /* ==========================================================
     Positionnement
     ========================================================== */
  function positionnerHole(rect) {
    if (!holeEl) return;
    if (!rect) {
      holeEl.style.top = '-9999px';
      holeEl.style.left = '-9999px';
      holeEl.style.width = '0px';
      holeEl.style.height = '0px';
      return;
    }
    holeEl.style.top = (rect.top - 4) + 'px';
    holeEl.style.left = (rect.left - 4) + 'px';
    holeEl.style.width = (rect.width + 8) + 'px';
    holeEl.style.height = (rect.height + 8) + 'px';
  }

  function positionnerTooltip(rect) {
    if (!tooltipEl) return;

    if (sidebarOuverteParTour) {
      tooltipEl.classList.add('mode-bas');
      tooltipEl.style.top = '';
      tooltipEl.style.left = '';
      return;
    } else {
      tooltipEl.classList.remove('mode-bas');
    }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const marge = MARGE;

    tooltipEl.style.top = '0px';
    tooltipEl.style.left = '0px';
    const tRect = tooltipEl.getBoundingClientRect();
    const tW = tRect.width;
    const tH = tRect.height;

    if (!rect) {
      tooltipEl.style.left = Math.round((W - tW) / 2) + 'px';
      tooltipEl.style.top = Math.round((H - tH) / 2) + 'px';
      return;
    }

    const espaceDroite = W - rect.right;
    const espaceGauche = rect.left;
    const espaceBas = H - rect.bottom;
    const espaceHaut = rect.top;

    const cibleLarge = rect.width > W * 0.55;
    const cibleHaute = rect.height > H * 0.55;
    const prefVertical = cibleLarge || cibleHaute;

    let top, left;

    if (!prefVertical && espaceDroite > tW + marge) {
      left = rect.right + marge;
      top = rect.top + (rect.height - tH) / 2;
    } else if (!prefVertical && espaceGauche > tW + marge) {
      left = rect.left - tW - marge;
      top = rect.top + (rect.height - tH) / 2;
    } else if (espaceBas > tH + marge) {
      top = rect.bottom + marge;
      left = rect.left + (rect.width - tW) / 2;
    } else if (espaceHaut > tH + marge) {
      top = rect.top - tH - marge;
      left = rect.left + (rect.width - tW) / 2;
    } else {
      left = (W - tW) / 2;
      top = (H - tH) / 2;
    }

    left = Math.max(marge, Math.min(left, W - tW - marge));
    top = Math.max(marge, Math.min(top, H - tH - marge));

    tooltipEl.style.left = Math.round(left) + 'px';
    tooltipEl.style.top = Math.round(top) + 'px';
  }

  function majPositions() {
    if (!actif) return;
    const rect = cibleEl && estVisible(cibleEl) ? cibleEl.getBoundingClientRect() : null;
    positionnerHole(rect);
    positionnerTooltip(rect);
  }

  function surScrollOuResize() {
    if (!actif) return;
    if (onScrollRaf) cancelAnimationFrame(onScrollRaf);
    onScrollRaf = requestAnimationFrame(majPositions);
  }

  /* ==========================================================
     Navigation entre etapes
     ========================================================== */
  async function allerEtape(n) {
    if (!actif) return;
    if (n < 0 || n >= etapesCourantes.length) return;

    if (idx >= 0 && idx !== n) {
      const etapePrec = etapesCourantes[idx];
      if (etapePrec) await executerHook(etapePrec.apres);
    }

    idx = n;
    const etape = etapesCourantes[n];

    await executerHook(etape.avant);

    if (tooltipEl) tooltipEl.classList.remove('actif');

    let cible = null;
    if (etape.selecteur) {
      if (etape.attendre) {
        try { await attendre(etape.attendre, 2500); } catch (e) {}
      }
      cible = trouverCible(etape);
    }
    cibleEl = cible;

    if (cible) {
      await scrollVersCible(cible);
      await new Promise(r => setTimeout(r, 80));
    }

    cibleRect = cible && estVisible(cible) ? cible.getBoundingClientRect() : null;

    rendreTooltip(etape);
    positionnerHole(cibleRect);
    positionnerTooltip(cibleRect);

    requestAnimationFrame(() => {
      if (holeEl) holeEl.classList.add('actif');
      if (tooltipEl) tooltipEl.classList.add('actif');
    });
  }

  function suivant() {
    if (idx >= etapesCourantes.length - 1) { terminer(); return; }
    allerEtape(idx + 1);
  }

  function precedent() {
    if (idx <= 0) return;
    allerEtape(idx - 1);
  }

  /* ==========================================================
     Demarrage / arret
     ========================================================== */
  async function demarrer() {
    if (actif) return;

    const etapes = etapesDeLaPage();
    if (!etapes || !etapes.length) {
      console.log('[Tour] Aucune visite definie pour cette page.');
      return;
    }
    etapesCourantes = etapes;

    await attendreBody();

    injecterCss();
    creerElements();

    actif = true;
    cacherBannierePWA();

    requestAnimationFrame(() => {
      if (blockerEl) blockerEl.classList.add('actif');
    });

    listenerKeydown = (e) => {
      if (!actif) return;
      if (e.key === 'Escape') { e.preventDefault(); terminer(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); suivant(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); precedent(); }
    };
    document.addEventListener('keydown', listenerKeydown);

    window.addEventListener('resize', surScrollOuResize);
    window.addEventListener('scroll', surScrollOuResize, true);

    await allerEtape(0);
  }

  async function terminer() {
    if (!actif) return;

    if (idx >= 0 && idx < etapesCourantes.length) {
      const etapeCourante = etapesCourantes[idx];
      if (etapeCourante) await executerHook(etapeCourante.apres);
    }

    actif = false;

    if (holeEl) holeEl.classList.remove('actif');
    if (tooltipEl) tooltipEl.classList.remove('actif');
    if (tooltipEl) tooltipEl.classList.remove('mode-bas');
    if (blockerEl) blockerEl.classList.remove('actif');

    if (sidebarOuverteParTour) {
      fermerSidebar();
      sidebarOuverteParTour = false;
    }

    if (listenerKeydown) {
      document.removeEventListener('keydown', listenerKeydown);
      listenerKeydown = null;
    }
    window.removeEventListener('resize', surScrollOuResize);
    window.removeEventListener('scroll', surScrollOuResize, true);

    restaurerBannierePWA();

    setTimeout(() => {
      if (!actif) detruireElements();
    }, 300);

    marquerVu(pageId());
  }

  function reinitialiser() {
    try {
      const aSupprimer = [];
      for (let i = 0; i < localStorage.length; i++) {
        const cle = localStorage.key(i);
        if (cle && cle.indexOf(PREFIXE_VU) === 0) {
          aSupprimer.push(cle);
        }
      }
      aSupprimer.forEach(cle => localStorage.removeItem(cle));
    } catch (e) {}
  }

  function reinitialiserPage() {
    try { localStorage.removeItem(cleVuPourPage(pageId())); } catch (e) {}
  }

  /* ==========================================================
     Auto-demarrage
     ========================================================== */
  async function autoDemarrer() {
    const id = pageId();
    const etapes = etapesDeLaPage();

    if (!etapes || !etapes.length) return;

    const forcer = lireFlagRelance();
    if (forcer) {
      reinitialiserPage();
    } else {
      if (dejaVu(id)) return;
    }

    try {
      await attendre('.sidebar', 3000);
    } catch (e) {}

    await new Promise(r => setTimeout(r, DELAI_AUTO));

    if (!actif && !dejaVu(id)) {
      demarrer();
    }
  }

  /* ==========================================================
     Init
     ========================================================== */
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoDemarrer);
    } else {
      autoDemarrer();
    }
  } catch (e) {
    console.warn('[Tour] Erreur initialisation :', e && e.message);
  }

  /* ==========================================================
     API publique
     ========================================================== */
  return {
    demarrer: demarrer,
    arreter: terminer,
    reinitialiser: reinitialiser,
    reinitialiserPage: reinitialiserPage,
    estVu: () => dejaVu(pageId()),
    pageId: pageId,
    pages: Object.keys(TOURS)
  };
})();