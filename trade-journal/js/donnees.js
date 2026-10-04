/* ============================================================
   DONNEES - Couche d'acces metier
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Application locale (sans Synchro)

   Ameliorations v3.0 :
   - Suppression de tous les appels Synchro
   - IndexedDB devient la source unique de verite
   ============================================================ */
const Donnees = {

  async tousLesTrades() {
    const trades = await Stockage.tous('trades');
    return trades.sort((a, b) =>
      (a.date + (a.heureEntree || '')).localeCompare(b.date + (b.heureEntree || '')));
  },

  async trade(id) { return Stockage.obtenir('trades', id); },

  async ajouterTrade(t) {
    if (!t.actif || !String(t.actif).trim()) {
      throw new Error('Le symbole de l\'actif est obligatoire.');
    }
    t.id = t.id || Utils.id();
    t.createdAt = new Date().toISOString();
    t.updatedAt = t.createdAt;
    await Stockage.ajouter('trades', t);
    return t;
  },

  async majTrade(t) {
    if (!t.actif || !String(t.actif).trim()) {
      throw new Error('Le symbole de l\'actif est obligatoire.');
    }
    t.updatedAt = new Date().toISOString();
    await Stockage.maj('trades', t);
    return t;
  },

  async supprimerTrade(id) {
    await Stockage.supprimer('trades', id);
  },

  async tousLesObjectifs() { return Stockage.tous('objectifs'); },
  async objectif(id) { return Stockage.obtenir('objectifs', id); },

  async ajouterObjectif(o) {
    o.id = o.id || Utils.id();
    o.createdAt = new Date().toISOString();
    o.updatedAt = o.createdAt;
    await Stockage.ajouter('objectifs', o);
    return o;
  },

  async majObjectif(o) {
    o.updatedAt = new Date().toISOString();
    await Stockage.maj('objectifs', o);
    return o;
  },

  async supprimerObjectif(id) {
    await Stockage.supprimer('objectifs', id);
  },

  async tousLesChallenges() { return Stockage.tous('challenges'); },
  async challenge(id) { return Stockage.obtenir('challenges', id); },

  async ajouterChallenge(c) {
    c.id = c.id || Utils.id();
    c.createdAt = new Date().toISOString();
    c.updatedAt = c.createdAt;
    await Stockage.ajouter('challenges', c);
    return c;
  },

  async majChallenge(c) {
    c.updatedAt = new Date().toISOString();
    await Stockage.maj('challenges', c);
    return c;
  },

  async supprimerChallenge(id) {
    await Stockage.supprimer('challenges', id);
  },

  async toutesLesNotes() {
    const n = await Stockage.tous('notes');
    return n.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },
  async note(id) { return Stockage.obtenir('notes', id); },

  async ajouterNote(n) {
    n.id = n.id || Utils.id();
    n.createdAt = new Date().toISOString();
    n.updatedAt = n.createdAt;
    await Stockage.ajouter('notes', n);
    return n;
  },

  async majNote(n) {
    n.updatedAt = new Date().toISOString();
    await Stockage.maj('notes', n);
    return n;
  },

  async supprimerNote(id) {
    await Stockage.supprimer('notes', id);
  },

  async toutesLesLecons() {
    const l = await Stockage.tous('lecons');
    return l.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },
  async lecon(id) { return Stockage.obtenir('lecons', id); },

  async ajouterLecon(l) {
    l.id = l.id || Utils.id();
    l.createdAt = new Date().toISOString();
    l.updatedAt = l.createdAt;
    await Stockage.ajouter('lecons', l);
    return l;
  },

  async majLecon(l) {
    l.updatedAt = new Date().toISOString();
    await Stockage.maj('lecons', l);
    return l;
  },

  async supprimerLecon(id) {
    await Stockage.supprimer('lecons', id);
  },

  async getSetups() {
    return (await Stockage.getMeta('setups', [])) || [];
  },
  async setSetups(liste) {
    await Stockage.setMeta('setups', liste);
  },
  async ajouterSetup(nom) {
    const l = await this.getSetups();
    if (!l.includes(nom)) l.push(nom);
    await this.setSetups(l);
    return l;
  },
  async supprimerSetup(nom) {
    const l = (await this.getSetups()).filter(s => s !== nom);
    await this.setSetups(l);
    return l;
  },

  getActifs() { return Utils.actifs(); },
  setActifs(liste) { return Utils.setActifs(liste); },
  ajouterActif(symbole, nom = null) { return Utils.ajouterActif(symbole, nom); },
  supprimerActif(symbole) { return Utils.supprimerActif(symbole); },
  renommerActif(symbole, nom) { return Utils.renommerActif(symbole, nom); },
  reinitialiserActifs() { return Utils.reinitialiserActifs(); },

  async exporterJSON() {
    return {
      version: 3,
      exporte: new Date().toISOString(),
      parametres: Utils.parametres(),
      actifs: Utils.actifs(),
      setups: await this.getSetups(),
      trades: await Stockage.tous('trades'),
      objectifs: await Stockage.tous('objectifs'),
      challenges: await Stockage.tous('challenges'),
      notes: await Stockage.tous('notes'),
      lecons: await Stockage.tous('lecons')
    };
  },

  async importerJSON(data, { remplacer = false } = {}) {
    if (!data || typeof data !== 'object') throw new Error('Format JSON invalide.');
    const stores = ['trades', 'objectifs', 'challenges', 'notes', 'lecons'];

    if (Array.isArray(data.trades)) {
      for (const t of data.trades) {
        if (!t.actif || !String(t.actif).trim()) {
          throw new Error('Un trade importe n\'a pas d\'actif renseigne.');
        }
      }
    }

    if (remplacer) {
      for (const s of stores) await Stockage.vider(s);
    }

    const stats = {};
    for (const s of stores) {
      const arr = Array.isArray(data[s]) ? data[s] : [];
      stats[s] = 0;
      for (const item of arr) {
        if (!item.id) item.id = Utils.id();
        await Stockage.ajouter(s, item);
        stats[s]++;
      }
    }

    if (data.parametres) {
      localStorage.setItem('tj_parametres', JSON.stringify(data.parametres));
    }
    if (Array.isArray(data.actifs) && data.actifs.length) {
      Utils.setActifs(data.actifs);
    }
    if (Array.isArray(data.setups)) {
      await this.setSetups(data.setups);
    }

    return stats;
  },

  async toutSupprimer() {
    await Stockage.viderTout();
  }
};