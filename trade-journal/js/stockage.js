/* ============================================================
   STOCKAGE - IndexedDB + OPFS (Origin Private File System)
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Ajout OPFS pour fichiers binaires

   - IndexedDB : donnees structurees (trades, notes, etc.)
   - OPFS      : fichiers binaires (captures d'ecran)

   OPFS = systeme de fichiers sandboxe sur l'appareil de
   l'utilisateur. Persiste entre les sessions, fonctionne
   hors ligne, disponible sur tous les navigateurs modernes.
   ============================================================ */
const Stockage = (() => {
  const DB_NAME = 'trade_journal_db';
  const DB_VERSION = 1;
  const STORES = ['trades', 'objectifs', 'challenges', 'notes', 'lecons', 'meta'];

  let dbPromise = null;
  let opfsRootPromise = null;

  /* ==========================================================
     INDEXEDDB
     ========================================================== */
  function ouvrir() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const s of STORES) {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: 'id' });
            if (s === 'trades') {
              store.createIndex('date', 'date');
              store.createIndex('actif', 'actif');
              store.createIndex('setup', 'setup');
            }
            if (s === 'notes') store.createIndex('date', 'date');
            if (s === 'lecons') store.createIndex('date', 'date');
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(store, mode, fn) {
    const db = await ouvrir();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let result;
      try { result = fn(s); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  /* ==========================================================
     OPFS - Origin Private File System
     ========================================================== */
  async function opfsRoot() {
    if (opfsRootPromise) return opfsRootPromise;
    if (!navigator.storage || typeof navigator.storage.getDirectory !== 'function') {
      opfsRootPromise = Promise.resolve(null);
      return opfsRootPromise;
    }
    opfsRootPromise = navigator.storage.getDirectory().catch((e) => {
      console.warn('[OPFS] Indisponible :', e.message);
      return null;
    });
    return opfsRootPromise;
  }

  async function opfsDisponible() {
    const root = await opfsRoot();
    return !!root;
  }

  async function ecrireFichier(chemin, blob) {
    const root = await opfsRoot();
    if (!root) throw new Error('OPFS indisponible sur ce navigateur');

    const parties = String(chemin).split('/').filter(Boolean);
    const nomFichier = parties.pop();
    let dossier = root;

    for (const p of parties) {
      dossier = await dossier.getDirectoryHandle(p, { create: true });
    }

    const handle = await dossier.getFileHandle(nomFichier, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();

    return chemin;
  }

  async function lireFichier(chemin) {
    const root = await opfsRoot();
    if (!root) return null;

    const parties = String(chemin).split('/').filter(Boolean);
    const nomFichier = parties.pop();
    let dossier = root;

    try {
      for (const p of parties) {
        dossier = await dossier.getDirectoryHandle(p);
      }
      const handle = await dossier.getFileHandle(nomFichier);
      return await handle.getFile();
    } catch (e) {
      return null;
    }
  }

  async function supprimerFichier(chemin) {
    const root = await opfsRoot();
    if (!root) return false;

    const parties = String(chemin).split('/').filter(Boolean);
    const nomFichier = parties.pop();
    let dossier = root;

    try {
      for (const p of parties) {
        dossier = await dossier.getDirectoryHandle(p);
      }
      await dossier.removeEntry(nomFichier);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function supprimerDossier(chemin) {
    const root = await opfsRoot();
    if (!root) return false;

    const parties = String(chemin).split('/').filter(Boolean);
    const nomDossier = parties.pop();
    let dossier = root;

    try {
      for (const p of parties) {
        dossier = await dossier.getDirectoryHandle(p);
      }
      await dossier.removeEntry(nomDossier, { recursive: true });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function lister(chemin) {
    const root = await opfsRoot();
    if (!root) return [];

    const parties = String(chemin || '').split('/').filter(Boolean);
    let dossier = root;

    try {
      for (const p of parties) {
        dossier = await dossier.getDirectoryHandle(p);
      }
      const resultats = [];
      for await (const [nom, handle] of dossier.entries()) {
        resultats.push({ nom: nom, type: handle.kind });
      }
      return resultats;
    } catch (e) {
      return [];
    }
  }

  async function espaceUtilise() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        return { utilisation: est.usage || 0, quota: est.quota || 0 };
      } catch (e) {}
    }
    return { utilisation: 0, quota: 0 };
  }

  /* ==========================================================
     API PUBLIQUE
     ========================================================== */
  return {
    async ajouter(store, obj) {
      if (!obj.id) obj.id = Utils.id();
      await tx(store, 'readwrite', s => s.put(obj));
      return obj;
    },
    async maj(store, obj) {
      await tx(store, 'readwrite', s => s.put(obj));
      return obj;
    },
    async supprimer(store, id) {
      await tx(store, 'readwrite', s => s.delete(id));
    },
    async obtenir(store, id) {
      const db = await ouvrir();
      return new Promise((resolve, reject) => {
        const t = db.transaction(store, 'readonly');
        const req = t.objectStore(store).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },
    async tous(store) {
      const db = await ouvrir();
      return new Promise((resolve, reject) => {
        const t = db.transaction(store, 'readonly');
        const req = t.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },
    async vider(store) {
      await tx(store, 'readwrite', s => s.clear());
    },
    async viderTout() {
      for (const s of STORES) {
        if (s === 'meta') continue;
        await tx(s, 'readwrite', st => st.clear());
      }
    },
    async setMeta(cle, valeur) {
      return this.ajouter('meta', { id: cle, valeur });
    },
    async getMeta(cle, fallback = null) {
      const r = await this.obtenir('meta', cle);
      return r ? r.valeur : fallback;
    },

    opfsDisponible,
    ecrireFichier,
    lireFichier,
    supprimerFichier,
    supprimerDossier,
    lister,
    espaceUtilise
  };
})();