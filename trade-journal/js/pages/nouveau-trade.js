/* ============================================================
   NOUVEAU-TRADE - Formulaire de saisie
   ------------------------------------------------------------
   Version : 4.0
   Derniere mise a jour : Application locale, OPFS

   Ameliorations v4.0 :
   - Suppression de Synchro
   - Upload des captures vers OPFS
   - Fallback chaine WebP -> JPEG -> brut
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-trade');
  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  const p = Utils.parametres();

  const selActif = form.querySelector('[name="actif"]');
  const actifs = Utils.actifs();

  if (!actifs.length) {
    selActif.innerHTML = '<option value="">Aucun actif - configure ton univers dans Parametres</option>';
  } else {
    selActif.innerHTML = '<option value="">-</option>' +
      actifs.map(a => '<option value="' + Utils.escapeHtml(a.symbole) + '">' + Utils.escapeHtml(a.symbole) + ' - ' + Utils.escapeHtml(a.nom) + '</option>').join('');
  }

  const selSession = form.querySelector('[name="session"]');
  selSession.insertAdjacentHTML('beforeend', '<option value="">-</option>');
  CONFIG.SESSIONS.forEach(s => selSession.insertAdjacentHTML('beforeend', '<option>' + s + '</option>'));

  const selTf = form.querySelector('[name="timeframe"]');
  selTf.insertAdjacentHTML('beforeend', '<option value="">-</option>');
  CONFIG.TIMEFRAMES.forEach(t => selTf.insertAdjacentHTML('beforeend', '<option>' + t + '</option>'));

  const selMental = document.getElementById('etat-mental');
  selMental.insertAdjacentHTML('beforeend', '<option value="">-</option>');
  CONFIG.ETATS_MENTAUX.forEach(e => selMental.insertAdjacentHTML('beforeend', '<option>' + e + '</option>'));

  async function rafraichirSetups(selectValue) {
    const select = document.getElementById('select-setup');
    const setups = await Donnees.getSetups();
    select.innerHTML = '<option value="">-</option>' +
      setups.map(s => '<option>' + Utils.escapeHtml(s) + '</option>').join('');
    if (selectValue) select.value = selectValue;
  }
  await rafraichirSetups();

  document.getElementById('btn-new-setup').onclick = async () => {
    const nom = prompt('Nom du nouveau setup :');
    if (!nom || !nom.trim()) return;
    await Donnees.ajouterSetup(nom.trim());
    await rafraichirSetups(nom.trim());
    Notif.succes('Setup ajoute.');
  };

  document.getElementById('btn-del-setup').onclick = async () => {
    const select = document.getElementById('select-setup');
    const nom = select.value;
    if (!nom) { Notif.warn('Selectionne un setup a supprimer.'); return; }
    if (!await Notif.confirmer('Supprimer le setup "' + nom + '" ? Les trades existants garderont leur libelle.')) return;
    await Donnees.supprimerSetup(nom);
    await rafraichirSetups();
    Notif.info('Setup supprime.');
  };

  const capitalAvant = document.getElementById('capital-avant');
  const risquePct = document.getElementById('risque-pct');
  const risqueMoney = document.getElementById('risque-money');
  const resultat = document.getElementById('resultat');
  const resultatPct = document.getElementById('resultat-pct');
  const resultatR = document.getElementById('resultat-r');
  const rrPlanifie = document.getElementById('rr-planifie');

  function recalculer() {
    const cap = Utils.nombre(capitalAvant.value);
    const rp = Utils.nombre(risquePct.value);
    const res = Utils.nombre(resultat.value);

    const rm = cap * (rp / 100);
    risqueMoney.value = rm > 0 ? rm.toFixed(2) : '';

    if (cap > 0) resultatPct.value = ((res / cap) * 100).toFixed(2);
    else resultatPct.value = '';

    if (rm > 0) resultatR.value = (res / rm).toFixed(2);
    else resultatR.value = '';

    const pe = Utils.nombre(form.querySelector('[name="prixEntree"]').value);
    const sl = Utils.nombre(form.querySelector('[name="stopLoss"]').value);
    const tp = Utils.nombre(form.querySelector('[name="takeProfit"]').value);
    if (pe && sl && tp && Math.abs(pe - sl) > 0) {
      rrPlanifie.value = (Math.abs(tp - pe) / Math.abs(pe - sl)).toFixed(2);
    }
  }

  ['capital-avant','risque-pct','resultat','prixEntree','stopLoss','takeProfit'].forEach(id => {
    const el = id.includes('-') ? document.getElementById(id) : form.querySelector('[name="' + id + '"]');
    el?.addEventListener('input', recalculer);
  });

  let blobAvant = null, blobApres = null;
  let urlAvant = null, urlApres = null;
  let cheminAvantExistant = null, cheminApresExistant = null;
  let legacyAvant = null, legacyApres = null;

  function libererUrl(url) {
    if (url && url.startsWith('blob:')) Utils.libererUrlObjet(url);
  }

  async function compresserInline(file, cibleKo) {
    const cible = (cibleKo || 250) * 1024;

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target.result);
      r.onerror = () => reject(new Error('Lecture du fichier impossible'));
      r.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Image non decodable par ce navigateur'));
      i.src = dataUrl;
    });

    const MAX = 1600;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error('Image sans dimensions');

    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
      else { w = Math.round(w * (MAX / h)); h = MAX; }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    let q = 0.85;
    let blob = null;

    for (let i = 0; i < 4; i++) {
      blob = await new Promise((resolve) => {
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(resolve, 'image/jpeg', q);
        } else {
          try {
            const durl = canvas.toDataURL('image/jpeg', q);
            const parts = durl.split(',');
            const bstr = atob(parts[1]);
            const arr = new Uint8Array(bstr.length);
            for (let j = 0; j < bstr.length; j++) arr[j] = bstr.charCodeAt(j);
            resolve(new Blob([arr], { type: 'image/jpeg' }));
          } catch (e) { resolve(null); }
        }
      });
      if (!blob) throw new Error('Compression canvas echouee');
      if (blob.size <= cible || q <= 0.55) break;
      q = Math.max(0.55, q - 0.1);
    }

    if (!blob) throw new Error('Aucun blob genere');

    return {
      blob: blob,
      objectUrl: URL.createObjectURL(blob),
      mime: 'image/jpeg',
      ext: 'jpg',
      taille: blob.size,
      nom: (file.name || 'capture').replace(/\.[^.]+$/, '') + '.jpg'
    };
  }

  async function traiterCapture(file, position) {
    const tailleKo = Math.round((file.size || 0) / 1024);
    const type = file.type || 'inconnu';
    const nom = file.name || 'sans-nom';

    Notif.info('Traitement de la capture ' + position + ' (' + type + ', ' + tailleKo + ' Ko)...');

    let resultat = null;
    let methode = '';

    if (typeof Utils.compresserImage === 'function') {
      try {
        resultat = await Utils.compresserImage(file, {
          maxDimension: 1600,
          cibleKo: 220,
          qualiteMax: 0.85,
          qualiteMin: 0.55,
          format: 'auto'
        });
        methode = 'WebP';
      } catch (err) {
        console.warn('[Capture] Utils.compresserImage a echoue :', err.message);
      }
    }

    if (!resultat) {
      try {
        resultat = await compresserInline(file, 250);
        methode = 'JPEG';
      } catch (err) {
        console.warn('[Capture] compresserInline a echoue :', err.message);
      }
    }

    if (!resultat) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = (e) => resolve(e.target.result);
          r.onerror = () => reject(new Error('Lecture impossible'));
          r.readAsDataURL(file);
        });

        const parts = dataUrl.split(',');
        const bstr = atob(parts[1]);
        const arr = new Uint8Array(bstr.length);
        for (let j = 0; j < bstr.length; j++) arr[j] = bstr.charCodeAt(j);
        const m = parts[0].match(/:(.*?);/);
        const mime = m ? m[1] : 'image/jpeg';
        const blob = new Blob([arr], { type: mime });

        resultat = {
          blob: blob,
          objectUrl: URL.createObjectURL(blob),
          mime: mime,
          ext: mime.split('/')[1] || 'jpg',
          taille: blob.size,
          nom: nom
        };
        methode = 'brut (sans compression)';
      } catch (err) {
        console.error('[Capture] Tous les fallbacks ont echoue :', err);
        Notif.erreur(
          'Impossible de traiter la capture ' + position + ' : ' + err.message +
          '. Fichier : ' + type + ' (' + tailleKo + ' Ko). Essaie un format JPG ou PNG.',
          12000
        );
        return;
      }
    }

    if (position === 'avant') {
      libererUrl(urlAvant);
      blobAvant = resultat.blob;
      urlAvant = resultat.objectUrl;
    } else {
      libererUrl(urlApres);
      blobApres = resultat.blob;
      urlApres = resultat.objectUrl;
    }

    const preview = document.getElementById('preview-' + position);
    if (preview) {
      const img = preview.querySelector('img');
      if (img) img.src = resultat.objectUrl;
      preview.classList.add('show');
    }

    Notif.succes(
      'Capture ' + position + ' : ' + Math.round(resultat.taille / 1024) + ' Ko (' + methode + ')'
    );
  }

  function setupPreview(inputId, position) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      traiterCapture(file, position);
    });
  }
  setupPreview('capture-avant', 'avant');
  setupPreview('capture-apres', 'apres');

  form.querySelector('[name="date"]').value = Utils.aujourdhuiISO();
  if (p.capitalInitial > 0) capitalAvant.value = p.capitalInitial;
  if (p.risqueStandard > 0) risquePct.value = p.risqueStandard;

  if (typeof Navigation !== 'undefined' && Navigation.sessionActive) {
    const active = Navigation.sessionActive();
    if (active && active !== 'Hors session') selSession.value = active;
  }

  let existant = null;
  if (editId) {
    existant = await Donnees.trade(editId);
    if (existant) {
      document.getElementById('titre').textContent = 'Modifier le trade';
      for (const [k, v] of Object.entries(existant)) {
        const el = form.querySelector('[name="' + k + '"]');
        if (el) {
          if (k === 'respectPlan') el.value = v ? 'true' : 'false';
          else el.value = v ?? '';
        }
      }

      if (existant.captureAvant) {
        if (StockageImages.estLegacyBase64(existant.captureAvant)) {
          legacyAvant = existant.captureAvant;
          const pr = document.getElementById('preview-avant');
          pr.querySelector('img').src = existant.captureAvant;
          pr.classList.add('show');
        } else {
          cheminAvantExistant = existant.captureAvant;
          const url = await StockageImages.urlSignee(existant.captureAvant);
          if (url) {
            const pr = document.getElementById('preview-avant');
            pr.querySelector('img').src = url;
            pr.classList.add('show');
          }
        }
      }
      if (existant.captureApres) {
        if (StockageImages.estLegacyBase64(existant.captureApres)) {
          legacyApres = existant.captureApres;
          const pr = document.getElementById('preview-apres');
          pr.querySelector('img').src = existant.captureApres;
          pr.classList.add('show');
        } else {
          cheminApresExistant = existant.captureApres;
          const url = await StockageImages.urlSignee(existant.captureApres);
          if (url) {
            const pr = document.getElementById('preview-apres');
            pr.querySelector('img').src = url;
            pr.classList.add('show');
          }
        }
      }

      recalculer();
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const trade = {};
    for (const [k, v] of fd.entries()) trade[k] = v;

    ['prixEntree','stopLoss','takeProfit','prixSortie','lot','capitalAvant','risquePourcentage',
     'risqueMonetaire','rrPlanifie','resultat','resultatPourcentage','resultatR','rrRealise'].forEach(k => {
      if (trade[k] !== '' && trade[k] !== undefined) trade[k] = Utils.nombre(trade[k]);
      else trade[k] = null;
    });
    trade.respectPlan = trade.respectPlan === 'true';

    if (!trade.date) return Notif.erreur('La date est obligatoire.');
    if (!trade.actif || !String(trade.actif).trim()) return Notif.erreur('Selectionne un actif.');
    if (trade.resultat === null) return Notif.erreur('Le resultat en $ est obligatoire.');
    if (trade.risquePourcentage !== null && trade.risquePourcentage < 0) return Notif.erreur('Le risque % doit etre positif.');

    const tradeId = existant ? existant.id : Utils.id();

    let captureAvantFinal = null;
    let captureApresFinal = null;

    if (blobAvant) {
      try {
        Notif.info('Enregistrement de la capture avant...');
        captureAvantFinal = await StockageImages.uploader(tradeId, 'avant', blobAvant, 'webp');
        if (cheminAvantExistant && cheminAvantExistant !== captureAvantFinal) {
          await StockageImages.supprimer(cheminAvantExistant);
        }
      } catch (err) {
        Notif.erreur('Echec enregistrement capture avant : ' + err.message, 8000);
        return;
      }
    } else if (cheminAvantExistant) {
      captureAvantFinal = cheminAvantExistant;
    } else if (legacyAvant) {
      try {
        Notif.info('Migration de la capture avant...');
        const blob = await fetch(legacyAvant).then(r => r.blob());
        const compresse = (typeof Utils.compresserImage === 'function')
          ? await Utils.compresserImage(blob, { cibleKo: 220 })
          : await compresserInline(blob, 250);
        captureAvantFinal = await StockageImages.uploader(tradeId, 'avant', compresse.blob, compresse.ext);
      } catch (err) {
        console.warn('[Migration] Capture avant echouee :', err);
        captureAvantFinal = null;
      }
    }

    if (blobApres) {
      try {
        Notif.info('Enregistrement de la capture apres...');
        captureApresFinal = await StockageImages.uploader(tradeId, 'apres', blobApres, 'webp');
        if (cheminApresExistant && cheminApresExistant !== captureApresFinal) {
          await StockageImages.supprimer(cheminApresExistant);
        }
      } catch (err) {
        Notif.erreur('Echec enregistrement capture apres : ' + err.message, 8000);
        return;
      }
    } else if (cheminApresExistant) {
      captureApresFinal = cheminApresExistant;
    } else if (legacyApres) {
      try {
        Notif.info('Migration de la capture apres...');
        const blob = await fetch(legacyApres).then(r => r.blob());
        const compresse = (typeof Utils.compresserImage === 'function')
          ? await Utils.compresserImage(blob, { cibleKo: 220 })
          : await compresserInline(blob, 250);
        captureApresFinal = await StockageImages.uploader(tradeId, 'apres', compresse.blob, compresse.ext);
      } catch (err) {
        console.warn('[Migration] Capture apres echouee :', err);
        captureApresFinal = null;
      }
    }

    trade.captureAvant = captureAvantFinal;
    trade.captureApres = captureApresFinal;
    trade.id = tradeId;

    try {
      if (existant) {
        trade.createdAt = existant.createdAt;
        await Donnees.majTrade(trade);
        Notif.succes('Trade mis a jour.');
      } else {
        await Donnees.ajouterTrade(trade);
        Notif.succes('Trade enregistre.');
      }
      if (!p.capitalInitial && trade.capitalAvant) {
        const pp = Utils.parametres();
        pp.capitalInitial = trade.capitalAvant;
        localStorage.setItem('tj_parametres', JSON.stringify(pp));
      }
      setTimeout(() => { location.href = 'journal.html'; }, 500);
    } catch (err) {
      Notif.erreur(err.message || 'Erreur lors de l\'enregistrement.');
    }
  });

  document.getElementById('btn-annuler').onclick = () => history.back();
});