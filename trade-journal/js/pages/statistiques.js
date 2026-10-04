/* ============================================================
   STATISTIQUES - Analyse globale
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Utilisation de Utils.symboles() pour la liste d'actifs
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const tous = await Donnees.tousLesTrades();
  let periode = 'tout';

  document.querySelectorAll('[data-periode]').forEach(p => {
    p.onclick = () => {
      document.querySelectorAll('[data-periode]').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      periode = p.dataset.periode;
      rendre();
    };
  });

  function filtrer() {
    if (periode === 'jour') return tous.filter(Calculs.dansAujourdhui);
    if (periode === 'semaine') return tous.filter(Calculs.dansSemaine);
    if (periode === 'mois') return tous.filter(Calculs.dansMois);
    return tous;
  }

  function rendre() {
    const trades = filtrer();
    const s = Calculs.statsGlobales(trades);

    const kpis = [
      ['Trades', s.total],
      ['Gagnants', s.gagnants, 'pos'],
      ['Perdants', s.perdants, 'neg'],
      ['BE', s.be],
      ['Winrate', Utils.formatPourcent(s.winrate)],
      ['P&L', Utils.formatMonnaie(s.pnl), s.pnl >= 0 ? 'pos' : 'neg'],
      ['R total', Utils.formatR(s.rTotal), s.rTotal >= 0 ? 'pos' : 'neg'],
      ['R moyen', Utils.formatR(s.rMoyen)],
      ['Profit factor', isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : 'Infini'],
      ['Expectancy', Utils.formatR(s.expectancy)],
      ['Gain moyen', Utils.formatMonnaie(s.gainMoyen), 'pos'],
      ['Perte moyenne', Utils.formatMonnaie(s.perteMoyenne), 'neg'],
      ['R:R moyen', s.rrMoyen.toFixed(2)]
    ];
    document.getElementById('kpis').innerHTML = kpis.map(([l,v,cls]) =>
      '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value ' + (cls||'') + '">' + v + '</div></div>'
    ).join('');

    const parMois = Calculs.parMois(trades);
    if (trades.length) {
      Graphiques.pnlMensuel('c-mois', parMois);
      Graphiques.distributionR('c-distr', Calculs.distributionR(trades));

      const statsActifs = {};
      const parActif = Calculs.parActif(trades);
      for (const a of Utils.symboles()) statsActifs[a] = Calculs.statsGlobales(parActif[a] || []);
      if (Utils.symboles().length) Graphiques.barresParActif('c-actifs', statsActifs);

      const parSetup = Calculs.parSetup(trades);
      const labels = Object.keys(parSetup);
      const rMoyens = labels.map(k => Calculs.statsGlobales(parSetup[k]).rMoyen);
      Graphiques.barresGeneriques('c-setups', labels, rMoyens, { formatter: v => v.toFixed(1) + 'R' });
    } else {
      ['c-mois','c-distr','c-actifs','c-setups'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.parentElement.innerHTML = '<div class="empty">Aucune donnee.</div>';
      });
    }
  }

  rendre();
});