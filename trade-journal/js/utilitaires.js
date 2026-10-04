/* ============================================================
   UTILITAIRES - Helpers generiques
   ------------------------------------------------------------
   Version : 2.3
   Derniere mise a jour : Compression cascade dimension + qualite

   Ameliorations v2.3 :
   - Boucle de compression en cascade : 4 dimensions x 4 qualites
   - Cible par defaut portee a 380 Ko (adaptee aux graphiques)
   - Dimension max portee a 1800 px (lisibilite preservee)
   - Jamais d'echec silencieux : retourne toujours un blob valide
   - Verification des dimensions et de l'integrite avant traitement
   ============================================================ */
const Utils = {
  id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  nombre(v, fallback = 0) {
    if (v === null || v === undefined || v === '') return fallback;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? fallback : n;
  },

  formatNombre(v, decimales = 2) {
    const n = Utils.nombre(v);
    const loc = Utils.parametres().formatNombre || 'fr-FR';
    return n.toLocaleString(loc, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  },

  formatMonnaie(v, decimales = 2) {
    const n = Utils.nombre(v);
    const devise = Utils.parametres().devise || 'USD';
    const symboles = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', CHF: 'CHF ', JPY: '\u00A5' };
    const s = symboles[devise] || (devise + ' ');
    const signe = n < 0 ? '-' : '';
    return signe + s + Math.abs(n).toLocaleString(Utils.parametres().formatNombre || 'fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  },

  formatPourcent(v, decimales = 2) {
    return Utils.formatNombre(v, decimales) + ' %';
  },

  formatR(v, decimales = 2) {
    const n = Utils.nombre(v);
    return (n >= 0 ? '+' : '') + Utils.formatNombre(n, decimales) + 'R';
  },

  aujourdhuiISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  },

  maintenantISO() {
    return new Date().toISOString();
  },

  formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const loc = Utils.parametres().formatNombre || 'fr-FR';
    return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateHeure(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const loc = Utils.parametres().formatNombre || 'fr-FR';
    return d.toLocaleString(loc, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },

  debutSemaine(date = new Date()) {
    const d = new Date(date);
    const jour = d.getDay() || 7;
    d.setDate(d.getDate() - jour + 1);
    d.setHours(0,0,0,0);
    return d;
  },

  debutMois(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  },

  debutAnnee(date = new Date()) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0);
  },

  parametres() {
    try {
      const raw = localStorage.getItem('tj_parametres');
      return raw ? { ...CONFIG.PARAMETRES_DEFAUT, ...JSON.parse(raw) } : { ...CONFIG.PARAMETRES_DEFAUT };
    } catch { return { ...CONFIG.PARAMETRES_DEFAUT }; }
  },

  actifs() {
    try {
      const p = Utils.parametres();
      if (Array.isArray(p.actifs) && p.actifs.length > 0) {
        return p.actifs
          .filter(a => a && typeof a === 'object' && a.symbole)
          .map(a => ({ symbole: String(a.symbole).toUpperCase(), nom: a.nom || a.symbole }));
      }
    } catch (e) {}
    return CONFIG.ACTIFS_PAR_DEFAUT.map(a => ({ ...a }));
  },

  setActifs(liste) {
    const propre = (liste || [])
      .filter(a => a && a.symbole && String(a.symbole).trim())
      .map(a => ({
        symbole: String(a.symbole).toUpperCase().trim(),
        nom: (a.nom && String(a.nom).trim()) || String(a.symbole).toUpperCase().trim()
      }));
    const p = Utils.parametres();
    p.actifs = propre;
    localStorage.setItem('tj_parametres', JSON.stringify(p));
    return propre;
  },

  symboles() {
    return Utils.actifs().map(a => a.symbole);
  },

  nomActif(symbole) {
    if (!symbole) return '';
    const s = String(symbole).toUpperCase();
    const a = Utils.actifs().find(x => x.symbole === s);
    return a ? (a.nom || a.symbole) : s;
  },

  estActifAutorise(symbole) {
    if (!symbole) return false;
    return Utils.symboles().includes(String(symbole).toUpperCase());
  },

  ajouterActif(symbole, nom = null) {
    if (!symbole || !String(symbole).trim()) return false;
    const s = String(symbole).toUpperCase().trim();
    const liste = Utils.actifs();
    if (liste.some(a => a.symbole === s)) return false;
    liste.push({ symbole: s, nom: (nom && String(nom).trim()) || s });
    Utils.setActifs(liste);
    return true;
  },

  supprimerActif(symbole) {
    if (!symbole) return false;
    const s = String(symbole).toUpperCase();
    const liste = Utils.actifs().filter(a => a.symbole !== s);
    Utils.setActifs(liste);
    return true;
  },

  renommerActif(symbole, nouveauNom) {
    const s = String(symbole).toUpperCase();
    const liste = Utils.actifs().map(a =>
      a.symbole === s ? { ...a, nom: (nouveauNom && String(nouveauNom).trim()) || s } : a
    );
    Utils.setActifs(liste);
    return true;
  },

  reinitialiserActifs() {
    Utils.setActifs(CONFIG.ACTIFS_PAR_DEFAUT);
    return Utils.actifs();
  },

  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (v !== null && v !== undefined) e.setAttribute(k, v);
    }
    const add = (c) => {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else if (typeof c === 'string') e.insertAdjacentHTML('beforeend', c);
      else if (c instanceof Node) e.appendChild(c);
    };
    add(children);
    return e;
  },

  escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  versCSV(lignes, entetes) {
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const header = entetes.map(esc).join(',');
    const rows = lignes.map(l => entetes.map(h => esc(l[h])).join(','));
    return [header, ...rows].join('\n');
  },

  telecharger(nomFichier, contenu, type = 'text/plain') {
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  },

  /* ============================================================
     COMPRESSION D'IMAGE - Cascade dimension + qualite
     ------------------------------------------------------------
     Algorithme :
     1. Lecture + decodage
     2. Pour chaque dimension [maxDim, 0.78x, 0.61x, 0.47x]
        Pour chaque qualite [qMax, +0.1, +0.2, +0.3 (min qMin)]
          Compresser, mesurer
          Si <= cible, retourner immediatement
     3. Si rien ne passe, retourner la meilleure tentative
        (la plus petite taille obtenue)

     Options :
       - maxDimension : cote max initial (defaut 1800)
       - cibleKo      : poids cible (defaut 380 Ko)
       - qualiteMin   : qualite minimale (defaut 0.45)
       - qualiteMax   : qualite de depart (defaut 0.85)
       - format       : 'auto' | 'webp' | 'jpeg'
     ============================================================ */
  async compresserImage(file, options = {}) {
    const {
      maxDimension = 1800,
      cibleKo = 380,
      qualiteMin = 0.45,
      qualiteMax = 0.85,
      format = 'auto'
    } = options;

    // --- Validation entree ---
    if (!file || !(file instanceof Blob)) {
      throw new Error('Fichier invalide');
    }
    if (file.size === 0) {
      throw new Error('Fichier vide');
    }
    if (!file.type || file.type.indexOf('image/') !== 0) {
      throw new Error('Format non supporte (' + (file.type || 'inconnu') + ')');
    }

    // --- Lecture ---
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target.result);
      r.onerror = () => reject(new Error('Lecture du fichier impossible'));
      r.onabort = () => reject(new Error('Lecture annulee'));
      r.readAsDataURL(file);
    });

    // --- Decodage ---
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(
        'Format ' + (file.type || '?') + ' non supporte par ce navigateur. ' +
        'Essaie une capture JPG ou PNG.'
      ));
      i.src = dataUrl;
    });

    const largeurSource = img.naturalWidth || img.width;
    const hauteurSource = img.naturalHeight || img.height;
    if (!largeurSource || !hauteurSource) {
      throw new Error('Image sans dimensions exploitables');
    }

    // --- Detection WebP ---
    const canvasTest = document.createElement('canvas');
    canvasTest.width = 1;
    canvasTest.height = 1;
    let supporteWebP = false;
    try {
      const t = canvasTest.toDataURL('image/webp', 0.1);
      supporteWebP = t.startsWith('data:image/webp');
    } catch (e) {}

    let mime = 'image/jpeg';
    let ext = 'jpg';
    if (supporteWebP && (format === 'auto' || format === 'webp')) {
      mime = 'image/webp';
      ext = 'webp';
    }

    // --- Cascade : dimensions x qualites ---
    const cibleOctets = cibleKo * 1024;
    const dimensions = [
      Math.min(maxDimension, Math.max(largeurSource, hauteurSource)),
      Math.round(maxDimension * 0.78),
      Math.round(maxDimension * 0.61),
      Math.round(maxDimension * 0.47)
    ];
    // Nettoyer les doublons et garder un minimum de 800px
    const dimsUniques = [...new Set(dimensions)].filter(d => d >= 800);

    const qualites = [qualiteMax, qualiteMax - 0.1, qualiteMax - 0.2, qualiteMin];

    let meilleurBlob = null;
    let meilleureDim = 0;
    let meilleureQualite = 0;

    for (const dim of dimsUniques) {
      // Redimensionner a cette dimension
      let w = largeurSource;
      let h = hauteurSource;
      if (w > dim || h > dim) {
        if (w > h) { h = Math.round(h * (dim / w)); w = dim; }
        else { w = Math.round(w * (dim / h)); h = dim; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D indisponible');
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      for (const q of qualites) {
        let blob = null;
        try {
          blob = await new Promise((resolve) => {
            let done = false;
            const fallback = () => {
              if (done) return;
              done = true;
              try {
                const durl = canvas.toDataURL(mime, q);
                const parts = durl.split(',');
                const bstr = atob(parts[1]);
                const arr = new Uint8Array(bstr.length);
                for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
                const m = parts[0].match(/:(.*?);/);
                resolve(new Blob([arr], { type: m ? m[1] : mime }));
              } catch (e) { resolve(null); }
            };

            if (typeof canvas.toBlob === 'function') {
              try {
                canvas.toBlob((b) => {
                  if (done) return;
                  done = true;
                  if (b) resolve(b);
                  else fallback();
                }, mime, q);
                setTimeout(() => { if (!done) fallback(); }, 3000);
              } catch (e) { fallback(); }
            } else {
              fallback();
            }
          });
        } catch (e) { blob = null; }

        if (!blob) continue;

        // Garder le meilleur resultat
        if (!meilleurBlob || blob.size < meilleurBlob.size) {
          meilleurBlob = blob;
          meilleureDim = dim;
          meilleureQualite = q;
        }

        // Cible atteinte : on sort immediatement
        if (blob.size <= cibleOctets) {
          return await finaliser(blob, mime, ext, w, h, file);
        }
      }
    }

    // Aucune iteration n'a atteint la cible
    if (!meilleurBlob) {
      throw new Error('Impossible de generer une image compressee');
    }

    // Si la meilleure tentative depasse 6 Mo, on refuse explicitement
    if (meilleurBlob.size > 6 * 1024 * 1024) {
      throw new Error(
        'Image trop lourde apres compression (' +
        Math.round(meilleurBlob.size / 1024 / 1024 * 10) / 10 + ' Mo). ' +
        'Essaie une capture d\'ecran moins grande.'
      );
    }

    // Sinon on retourne la meilleure tentative, avec avertissement
    return await finaliser(meilleurBlob, mime, ext, 0, 0, file, true);
  },

  /* Libere proprement une object URL */
  libererUrlObjet(url) {
    if (!url || typeof url !== 'string') return;
    if (url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch (e) {}
    }
  }
};

/* Helper interne pour la compression (sortie du bloc Utils) */
async function finaliser(blob, mime, ext, w, h, file, avertissement) {
  const objectUrl = URL.createObjectURL(blob);
  return {
    blob,
    objectUrl,
    mime,
    ext,
    taille: blob.size,
    largeur: w,
    hauteur: h,
    nom: (file.name || 'capture').replace(/\.[^.]+$/, '') + '.' + ext,
    avertissement: avertissement || false
  };
}