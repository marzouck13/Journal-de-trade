/* ============================================================
   CALCULS - Toutes les statistiques
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification de la logique metier
   - Documentation mise a jour
   ============================================================ */
const Calculs = {

  statsGlobales(trades) {
    const t = trades || [];
    const total = t.length;
    const gagnants = t.filter(x => (x.resultat || 0) > 0);
    const perdants = t.filter(x => (x.resultat || 0) < 0);
    const be = t.filter(x => (x.resultat || 0) === 0);

    const totalGain = gagnants.reduce((s, x) => s + Utils.nombre(x.resultat), 0);
    const totalPerte = Math.abs(perdants.reduce((s, x) => s + Utils.nombre(x.resultat), 0));
    const pnl = totalGain - totalPerte;

    const winrate = total ? (gagnants.length / total) * 100 : 0;
    const tauxPerte = total ? (perdants.length / total) * 100 : 0;

    const gainMoyen = gagnants.length ? totalGain / gagnants.length : 0;
    const perteMoyenne = perdants.length ? -totalPerte / perdants.length : 0;

    const gainsR = gagnants.map(x => Utils.nombre(x.resultatR));
    const pertesR = perdants.map(x => Utils.nombre(x.resultatR));
    const gainMoyenR = gainsR.length ? gainsR.reduce((a,b)=>a+b,0) / gainsR.length : 0;
    const perteMoyenneR = pertesR.length ? pertesR.reduce((a,b)=>a+b,0) / pertesR.length : 0;

    const profitFactor = totalPerte > 0 ? totalGain / totalPerte : (totalGain > 0 ? Infinity : 0);
    const expectancy = (winrate/100) * gainMoyenR + (tauxPerte/100) * perteMoyenneR;
    const rTotal = t.reduce((s, x) => s + Utils.nombre(x.resultatR), 0);
    const rMoyen = total ? rTotal / total : 0;

    const rrMoyen = (() => {
      const vals = t.filter(x => x.rrRealise != null && x.rrRealise !== '')
                     .map(x => Utils.nombre(x.rrRealise));
      return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    })();

    return {
      total, gagnants: gagnants.length, perdants: perdants.length, be: be.length,
      pnl, totalGain, totalPerte,
      winrate, tauxPerte,
      gainMoyen, perteMoyenne,
      profitFactor, expectancy,
      rTotal, rMoyen, rrMoyen
    };
  },

  series(trades) {
    let serieActuelle = 0, meilleureSerie = 0, plusLongueSeriePerdante = 0, seriePerdanteActuelle = 0;
    for (const t of trades) {
      const r = Utils.nombre(t.resultat);
      if (r > 0) {
        seriePerdanteActuelle = 0;
        serieActuelle = serieActuelle >= 0 ? serieActuelle + 1 : 1;
        meilleureSerie = Math.max(meilleureSerie, serieActuelle);
      } else if (r < 0) {
        serieActuelle = 0;
        seriePerdanteActuelle++;
        plusLongueSeriePerdante = Math.max(plusLongueSeriePerdante, seriePerdanteActuelle);
      }
    }
    let serieCourante = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      const r = Utils.nombre(trades[i].resultat);
      if (r > 0) { if (serieCourante >= 0) serieCourante++; else break; }
      else if (r < 0) { if (serieCourante <= 0) serieCourante--; else break; }
      else break;
    }
    return { serieCourante, meilleureSerie, plusLongueSeriePerdante };
  },

  courbeCapital(trades, capitalInitial) {
    const points = [];
    let cap = capitalInitial;
    let peak = capitalInitial;
    let maxDD = 0, maxDDPct = 0;

    for (const t of trades) {
      cap += Utils.nombre(t.resultat);
      if (cap > peak) peak = cap;
      const dd = peak - cap;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      maxDD = Math.max(maxDD, dd);
      maxDDPct = Math.max(maxDDPct, ddPct);
      points.push({
        date: t.date + (t.heureEntree ? 'T'+t.heureEntree : ''),
        capital: cap, pnlCumule: cap - capitalInitial, drawdown: -dd, drawdownPct: -ddPct
      });
    }

    const capitalActuel = cap;
    const ddActuel = peak - capitalActuel;
    const ddActuelPct = peak > 0 ? (ddActuel / peak) * 100 : 0;

    return { points, capitalActuel, peak, maxDD, maxDDPct, ddActuel, ddActuelPct };
  },

  dansAujourdhui(t) { return t.date === Utils.aujourdhuiISO(); },
  dansSemaine(t) {
    const d = new Date(t.date);
    return d >= Utils.debutSemaine() && d <= new Date();
  },
  dansMois(t) {
    const d = new Date(t.date);
    return d >= Utils.debutMois() && d <= new Date();
  },

  parActif(trades) {
    const res = {};
    for (const a of Utils.symboles()) res[a] = [];
    for (const t of trades) {
      const k = (t.actif || '').toUpperCase();
      if (!res[k]) res[k] = [];
      res[k].push(t);
    }
    return res;
  },

  parSetup(trades) {
    const res = {};
    for (const t of trades) {
      const k = t.setup || '-';
      if (!res[k]) res[k] = [];
      res[k].push(t);
    }
    return res;
  },

  parJour(trades) {
    const res = {};
    for (const t of trades) {
      const k = t.date;
      if (!res[k]) res[k] = [];
      res[k].push(t);
    }
    return res;
  },

  parMois(trades) {
    const res = {};
    for (const t of trades) {
      const k = t.date.slice(0, 7);
      if (!res[k]) res[k] = [];
      res[k].push(t);
    }
    return res;
  },

  scoreDiscipline(trades) {
    if (!trades.length) return { score: 0, detail: {} };
    const total = trades.length;
    const respectPlan = trades.filter(t => t.respectPlan === true || t.respectPlan === 'true').length;
    const sansErreur = trades.filter(t => !t.erreur || t.erreur.trim() === '').length;
    const risqueRespecte = trades.filter(t => {
      const p = Utils.parametres();
      const r = Utils.nombre(t.risquePourcentage);
      return r > 0 && r <= p.risqueMaximal;
    }).length;

    const pctPlan = (respectPlan / total) * 100;
    const pctSansErreur = (sansErreur / total) * 100;
    const pctRisque = (risqueRespecte / total) * 100;

    const score = (pctPlan * 0.4 + pctSansErreur * 0.3 + pctRisque * 0.3);

    return {
      score: Math.round(score),
      detail: {
        pctPlan: pctPlan.toFixed(1),
        pctSansErreur: pctSansErreur.toFixed(1),
        pctRisque: pctRisque.toFixed(1),
        respectPlan, sansErreur, risqueRespecte, total
      }
    };
  },

  distributionR(trades) {
    const buckets = {
      '<= -2R': 0, '-2R a -1R': 0, '-1R a 0': 0,
      '0 a 1R': 0, '1R a 2R': 0, '2R a 3R': 0, '>= 3R': 0
    };
    for (const t of trades) {
      const r = Utils.nombre(t.resultatR);
      if (r <= -2) buckets['<= -2R']++;
      else if (r < -1) buckets['-2R a -1R']++;
      else if (r < 0) buckets['-1R a 0']++;
      else if (r <= 1) buckets['0 a 1R']++;
      else if (r <= 2) buckets['1R a 2R']++;
      else if (r <= 3) buckets['2R a 3R']++;
      else buckets['>= 3R']++;
    }
    return buckets;
  }
};