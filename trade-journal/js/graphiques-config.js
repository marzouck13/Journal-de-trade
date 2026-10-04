/* ============================================================
   GRAPHIQUES-CONFIG - Persistance de la configuration graphique
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Ajout de la gestion des indicateurs

   - Persiste symbole + interval + liste d'indicateurs
   - Synchronise avec Supabase (parametres_utilisateur.graphiques_config)
   - Fournit un catalogue d'indicateurs TradingView disponibles
   ============================================================ */
const GraphiquesConfig = (() => {
  const CLE_LOCALE = 'tj_graphiques_config';

  const DEFAUT = {
    symbole: 'OANDA:XAUUSD',
    interval: '60',
    style: '1',
    indicateurs: []  // ex: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies']
  };

  const CATALOGUE = [
    { id: 'RSI@tv-basicstudies',              label: 'RSI (Relative Strength Index)', categorie: 'Oscillateurs' },
    { id: 'StochasticRSI@tv-basicstudies',    label: 'Stochastic RSI',                categorie: 'Oscillateurs' },
    { id: 'Stochastic@tv-basicstudies',       label: 'Stochastique',                  categorie: 'Oscillateurs' },
    { id: 'MACD@tv-basicstudies',             label: 'MACD',                          categorie: 'Oscillateurs' },
    { id: 'CCI@tv-basicstudies',              label: 'CCI',                           categorie: 'Oscillateurs' },
    { id: 'WilliamR@tv-basicstudies',         label: 'Williams %R',                   categorie: 'Oscillateurs' },
    { id: 'Momentum@tv-basicstudies',         label: 'Momentum',                      categorie: 'Oscillateurs' },

    { id: 'MASimple@tv-basicstudies',         label: 'Moyenne mobile simple (SMA)',   categorie: 'Moyennes' },
    { id: 'MAExp@tv-basicstudies',            label: 'Moyenne mobile exponentielle (EMA)', categorie: 'Moyennes' },
    { id: 'MAWeighted@tv-basicstudies',       label: 'Moyenne mobile ponderee (WMA)', categorie: 'Moyennes' },
    { id: 'VWMA@tv-basicstudies',             label: 'VWMA',                          categorie: 'Moyennes' },

    { id: 'BB@tv-basicstudies',               label: 'Bandes de Bollinger',           categorie: 'Volatilite' },
    { id: 'KeltnerChannels@tv-basicstudies',  label: 'Keltner Channels',              categorie: 'Volatilite' },
    { id: 'DonchianChannels@tv-basicstudies', label: 'Donchian Channels',             categorie: 'Volatilite' },
    { id: 'ATR@tv-basicstudies',              label: 'ATR',                           categorie: 'Volatilite' },

    { id: 'ADX@tv-basicstudies',              label: 'ADX',                           categorie: 'Tendance' },
    { id: 'ParabolicSAR@tv-basicstudies',     label: 'Parabolic SAR',                 categorie: 'Tendance' },
    { id: 'IchimokuCloud@tv-basicstudies',    label: 'Ichimoku Cloud',                categorie: 'Tendance' },
    { id: 'Supertrend@tv-basicstudies',       label: 'Supertrend',                    categorie: 'Tendance' },

    { id: 'Volume@tv-basicstudies',           label: 'Volume',                        categorie: 'Volume' },
    { id: 'OBV@tv-basicstudies',              label: 'OBV (On Balance Volume)',       categorie: 'Volume' },
    { id: 'VWAP@tv-basicstudies',             label: 'VWAP',                          categorie: 'Volume' },

    { id: 'PivotPointsStandard@tv-basicstudies',        label: 'Pivots Classiques',   categorie: 'Pivots' },
    { id: 'PivotPointsFibonacci@tv-basicstudies',       label: 'Pivots Fibonacci',    categorie: 'Pivots' },
    { id: 'PivotPointsCamarilla@tv-basicstudies',       label: 'Pivots Camarilla',    categorie: 'Pivots' },
    { id: 'PivotPointsWoodie@tv-basicstudies',          label: 'Pivots Woodie',       categorie: 'Pivots' }
  ];

  function lireLocal() {
    try {
      const raw = localStorage.getItem(CLE_LOCALE);
      if (!raw) return { ...DEFAUT };
      const data = JSON.parse(raw);
      return {
        symbole: data.symbole || DEFAUT.symbole,
        interval: data.interval || DEFAUT.interval,
        style: data.style || DEFAUT.style,
        indicateurs: Array.isArray(data.indicateurs) ? data.indicateurs : []
      };
    } catch (e) {
      return { ...DEFAUT };
    }
  }

  function ecrireLocal(config) {
    try {
      localStorage.setItem(CLE_LOCALE, JSON.stringify(config));
    } catch (e) {}
  }

  async function pousserCloud() {
    if (typeof Auth === 'undefined') return;
    const client = Auth.client();
    if (!client) return;
    const uid = Auth.id();
    if (!uid) return;

    const config = lireLocal();
    try {
      await client
        .from('parametres_utilisateur')
        .upsert({
          utilisateur_id: uid,
          graphiques_config: config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'utilisateur_id' });
    } catch (e) {}
  }

  async function tirerCloud() {
    if (typeof Auth === 'undefined') return null;
    const client = Auth.client();
    if (!client) return null;
    const uid = Auth.id();
    if (!uid) return null;

    try {
      const { data } = await client
        .from('parametres_utilisateur')
        .select('graphiques_config')
        .eq('utilisateur_id', uid)
        .maybeSingle();
      if (data && data.graphiques_config) return data.graphiques_config;
    } catch (e) {}
    return null;
  }

  function get(cle) { return lireLocal()[cle]; }

  function set(cle, valeur) {
    const config = lireLocal();
    config[cle] = valeur;
    ecrireLocal(config);
    pousserCloud();
    return config;
  }

  function tout() { return lireLocal(); }

  function reinitialiser() {
    ecrireLocal({ ...DEFAUT });
    pousserCloud();
  }

  function ajouterIndicateur(id) {
    if (!id) return false;
    const config = lireLocal();
    if (config.indicateurs.indexOf(id) !== -1) return false;
    config.indicateurs.push(id);
    ecrireLocal(config);
    pousserCloud();
    return true;
  }

  function retirerIndicateur(id) {
    const config = lireLocal();
    const avant = config.indicateurs.length;
    config.indicateurs = config.indicateurs.filter(x => x !== id);
    if (config.indicateurs.length === avant) return false;
    ecrireLocal(config);
    pousserCloud();
    return true;
  }

  function viderIndicateurs() {
    const config = lireLocal();
    config.indicateurs = [];
    ecrireLocal(config);
    pousserCloud();
  }

  function indicateurs() { return lireLocal().indicateurs; }

  function catalogue() { return CATALOGUE; }

  function libelleIndicateur(id) {
    const item = CATALOGUE.find(x => x.id === id);
    return item ? item.label : id;
  }

  async function initialiser() {
    const cloud = await tirerCloud();
    if (cloud && cloud.symbole) {
      const local = lireLocal();
      ecrireLocal({
        symbole: cloud.symbole || local.symbole,
        interval: cloud.interval || local.interval,
        style: cloud.style || local.style,
        indicateurs: Array.isArray(cloud.indicateurs) ? cloud.indicateurs : local.indicateurs
      });
    }
  }

  return {
    initialiser,
    tout,
    get,
    set,
    reinitialiser,
    DEFAUT,
    CATALOGUE,
    catalogue,
    ajouterIndicateur,
    retirerIndicateur,
    viderIndicateurs,
    indicateurs,
    libelleIndicateur,
    symbole: () => get('symbole'),
    interval: () => get('interval'),
    setSymbole: (v) => set('symbole', v),
    setInterval: (v) => set('interval', v)
  };
})();