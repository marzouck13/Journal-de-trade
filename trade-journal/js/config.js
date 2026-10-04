/* ============================================================
   CONFIG - Univers de trading personnalisable
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Duree d'essai portee a 25 jours
   - Ajout de constantes liees a l'authentification
   ============================================================ */
const CONFIG = {
  APP_NAME: 'Trade Journal',
  DUREE_ESSAI_JOURS: 25,

  ACTIFS_PAR_DEFAUT: [
    { symbole: 'XAUUSD', nom: 'Gold / Or' },
    { symbole: 'XRPUSD', nom: 'XRP' },
    { symbole: 'BNBUSD', nom: 'BNB' },
    { symbole: 'BTCUSD', nom: 'Bitcoin' }
  ],

  ACTIFS_SUGGERES: [
    'XAUUSD', 'XAGUSD', 'XPTUSD',
    'BTCUSD', 'ETHUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD',
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD',
    'US30', 'NAS100', 'SPX500', 'GER40', 'UK100', 'JP225', 'FRA40',
    'USOIL', 'UKOIL', 'NGAS',
    'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL'
  ],

  SESSIONS: ['Asie', 'Londres', 'New York', 'Overlap', 'Hors session'],
  DIRECTIONS: ['BUY', 'SELL'],
  TIMEFRAMES: ['M1','M5','M15','M30','H1','H4','D1','W1','MN'],
  STATUTS: ['WIN', 'LOSS', 'BE'],

  ETATS_MENTAUX: [
    'Calme', 'Confiant', 'Impatient', 'Stresse',
    'Euphorique', 'Frustre', 'Fatigue', 'Neutre'
  ],

  SETUPS_PAR_DEFAUT: [],

  TAGS_LECONS: [
    'TIMING', 'RISQUE', 'DISCIPLINE', 'ENTREE', 'SORTIE',
    'VOLATILITE', 'PSYCHOLOGIE', 'SETUP', 'GESTION', 'AUTRE'
  ],

  CATEGORIES_OBJECTIFS: [
    'PERFORMANCE', 'RISQUE', 'DISCIPLINE',
    'APPRENTISSAGE', 'PROCESSUS', 'CAPITAL'
  ],

  TYPES_OBJECTIFS: [
    'Quotidien', 'Hebdomadaire', 'Mensuel',
    'Trimestriel', 'Annuel', 'Personnalise'
  ],

  PARAMETRES_DEFAUT: {
    devise: 'USD',
    capitalInitial: 0,
    risqueStandard: 1,
    risqueMaximal: 2,
    drawdownMaximal: 20,
    tradesMaxJour: 5,
    fuseauHoraire: Intl.DateTimeFormat().resolvedOptions().timeZone,
    formatNombre: 'fr-FR',
    theme: 'sombre'
  }
};