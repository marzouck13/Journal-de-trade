/* ============================================================
   RAPPORTS - Bilan quotidien et mensuel
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Utilisation de Utils.symboles() pour les actifs
   - Documentation mise a jour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const trades = await Donnees.tousLesTrades();

  async function bilanJour() {
    const jour = Utils.aujourdhuiISO();
    const tJour = trades.filter(t => t.date === jour);
    const s = Calculs.statsGlobales(tJour);
    const actifs = Array.from(new Set(tJour.map(t => t.actif)));
    const setups = Array.from(new Set(tJour.map(t => t.setup).filter(Boolean)));
    const erreurs = tJour.filter(t => t.erreur && t.erreur.trim());
    const respectPlan = tJour.filter(t => t.respectPlan).length;

    afficher(
      '<div class="card">' +
        '<div class="card-header">' +
          '<div><div class="card-title">Bilan du ' + Utils.formatDate(jour) + '</div></div>' +
        '</div>' +
        '<div class="kpi-grid">' +
          kpi('P&L', Utils.formatMonnaie(s.pnl), s.pnl>=0?'pos':'neg') +
          kpi('R total', Utils.formatR(s.rTotal), s.rTotal>=0?'pos':'neg') +
          kpi('Trades', s.total) +
          kpi('Gagnants', s.gagnants, 'pos') +
          kpi('Perdants', s.perdants, 'neg') +
          kpi('Winrate', Utils.formatPourcent(s.winrate)) +
          kpi('Meilleur', tJour.length ? Utils.formatMonnaie(Math.max(...tJour.map(t=>Utils.nombre(t.resultat)))) : '-', 'pos') +
          kpi('Pire', tJour.length ? Utils.formatMonnaie(Math.min(...tJour.map(t=>Utils.nombre(t.resultat)))) : '-', 'neg') +
          kpi('Respect du plan', tJour.length ? respectPlan + '/' + tJour.length : '-') +
        '</div>' +
        '<div class="grid-2" style="margin-top:16px">' +
          '<div><div class="section-title">Actifs trades</div><div class="text-sm">' + (actifs.join(', ') || '-') + '</div></div>' +
          '<div><div class="section-title">Setups utilises</div><div class="text-sm">' + (setups.join(', ') || '-') + '</div></div>' +
        '</div>' +
        (erreurs.length ? '<div style="margin-top:16px"><div class="section-title">Erreurs</div><ul style="padding-left:20px;font-size:13px">' + erreurs.map(e => '<li>' + Utils.escapeHtml(e.erreur) + '</li>').join('') + '</ul></div>' : '') +
        '<div style="margin-top:16px">' +
          '<div class="section-title">Ma lecon du jour</div>' +
          '<textarea class="textarea" id="lecon-jour" placeholder="Ecris ici ta lecon du jour...">' + Utils.escapeHtml(await Stockage.getMeta('lecon_'+jour, '')) + '</textarea>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:8px" id="save-lecon">Enregistrer la lecon</button>' +
        '</div>' +
      '</div>'
    );
    document.getElementById('save-lecon').onclick = async () => {
      const v = document.getElementById('lecon-jour').value;
      await Stockage.setMeta('lecon_'+jour, v);
      Notif.succes('Lecon enregistree.');
    };
  }

  async function rapportMois() {
    const now = new Date();
    const prefix = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    const tMois = trades.filter(t => t.date.startsWith(prefix));
    const s = Calculs.statsGlobales(tMois);
    const courbe = Calculs.courbeCapital(tMois, 0);

    const parJour = Calculs.parJour(tMois);
    const jours = Object.entries(parJour).map(([d, ts]) => ({ d, pnl: ts.reduce((sum,t)=>sum+Utils.nombre(t.resultat),0) }));
    const meilleurJour = jours.length ? jours.reduce((a,b) => a.pnl > b.pnl ? a : b) : null;
    const pireJour = jours.length ? jours.reduce((a,b) => a.pnl < b.pnl ? a : b) : null;

    const parActif = Calculs.parActif(tMois);
    const statsActifs = Utils.symboles().map(a => ({ a, ...Calculs.statsGlobales(parActif[a]||[]) }));
    const meilleurActif = statsActifs.length ? statsActifs.reduce((a,b) => a.pnl > b.pnl ? a : b) : null;
    const pireActif = statsActifs.length ? statsActifs.reduce((a,b) => a.pnl < b.pnl ? a : b) : null;

    const parSetup = Calculs.parSetup(tMois);
    const statsSetups = Object.entries(parSetup).map(([k,v]) => ({ k, ...Calculs.statsGlobales(v) }));
    const meilleurSetup = statsSetups.length ? statsSetups.reduce((a,b) => a.pnl > b.pnl ? a : b) : null;
    const pireSetup = statsSetups.length ? statsSetups.reduce((a,b) => a.pnl < b.pnl ? a : b) : null;

    const respectPlan = tMois.filter(t => t.respectPlan).length;

    afficher(
      '<div class="card">' +
        '<div class="card-header">' +
          '<div><div class="card-title">Rapport mensuel - ' + prefix + '</div></div>' +
        '</div>' +
        '<div class="kpi-grid">' +
          kpi('P&L', Utils.formatMonnaie(s.pnl), s.pnl>=0?'pos':'neg') +
          kpi('Trades', s.total) +
          kpi('Winrate', Utils.formatPourcent(s.winrate)) +
          kpi('Profit factor', isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : 'Infini') +
          kpi('Expectancy', Utils.formatR(s.expectancy)) +
          kpi('R total', Utils.formatR(s.rTotal)) +
          kpi('DD max', Utils.formatPourcent(courbe.maxDDPct), 'neg') +
          kpi('Respect du plan', tMois.length ? respectPlan + '/' + tMois.length : '-') +
        '</div>' +
        '<div class="grid-2" style="margin-top:16px">' +
          '<div><div class="section-title">Meilleur jour</div><div class="text-sm">' + (meilleurJour ? Utils.formatDate(meilleurJour.d) + ' - ' + Utils.formatMonnaie(meilleurJour.pnl) : '-') + '</div></div>' +
          '<div><div class="section-title">Pire jour</div><div class="text-sm">' + (pireJour ? Utils.formatDate(pireJour.d) + ' - ' + Utils.formatMonnaie(pireJour.pnl) : '-') + '</div></div>' +
          '<div><div class="section-title">Meilleur actif</div><div class="text-sm">' + (meilleurActif && meilleurActif.total ? meilleurActif.a + ' - ' + Utils.formatMonnaie(meilleurActif.pnl) : '-') + '</div></div>' +
          '<div><div class="section-title">Pire actif</div><div class="text-sm">' + (pireActif && pireActif.total ? pireActif.a + ' - ' + Utils.formatMonnaie(pireActif.pnl) : '-') + '</div></div>' +
          '<div><div class="section-title">Meilleur setup</div><div class="text-sm">' + (meilleurSetup ? Utils.escapeHtml(meilleurSetup.k) + ' - ' + Utils.formatMonnaie(meilleurSetup.pnl) : '-') + '</div></div>' +
          '<div><div class="section-title">Pire setup</div><div class="text-sm">' + (pireSetup ? Utils.escapeHtml(pireSetup.k) + ' - ' + Utils.formatMonnaie(pireSetup.pnl) : '-') + '</div></div>' +
        '</div>' +
        '<div style="margin-top:20px">' +
          '<div class="section-title">Ce qui a fonctionne</div>' +
          '<textarea class="textarea" id="m-bon">' + Utils.escapeHtml(await Stockage.getMeta('rapport_'+prefix+'_bon', '')) + '</textarea>' +
          '<div class="section-title" style="margin-top:12px">Ce qui doit etre ameliore</div>' +
          '<textarea class="textarea" id="m-amel">' + Utils.escapeHtml(await Stockage.getMeta('rapport_'+prefix+'_amel', '')) + '</textarea>' +
          '<div class="section-title" style="margin-top:12px">Objectifs du mois suivant</div>' +
          '<textarea class="textarea" id="m-obj">' + Utils.escapeHtml(await Stockage.getMeta('rapport_'+prefix+'_obj', '')) + '</textarea>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:12px" id="save-rapport">Enregistrer</button>' +
        '</div>' +
      '</div>'
    );
    document.getElementById('save-rapport').onclick = async () => {
      await Stockage.setMeta('rapport_'+prefix+'_bon', document.getElementById('m-bon').value);
      await Stockage.setMeta('rapport_'+prefix+'_amel', document.getElementById('m-amel').value);
      await Stockage.setMeta('rapport_'+prefix+'_obj', document.getElementById('m-obj').value);
      Notif.succes('Rapport enregistre.');
    };
  }

  function kpi(l, v, cls = '') {
    return '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value ' + cls + '">' + v + '</div></div>';
  }

  function afficher(html) {
    document.getElementById('rapport').innerHTML = html;
  }

  document.getElementById('btn-jour').onclick = bilanJour;
  document.getElementById('btn-mois').onclick = rapportMois;
});