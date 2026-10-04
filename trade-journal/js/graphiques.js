/* ============================================================
   GRAPHIQUES - Chart.js avec couleurs CSS
   ------------------------------------------------------------
   Version : 2.0
   Derniere mise a jour : Refonte authentification complete

   Ameliorations v2.0 :
   - Aucune modification fonctionnelle
   - Documentation mise a jour
   ============================================================ */
const Graphiques = {
  instances: {},

  detruire(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  couleurs() {
    const s = getComputedStyle(document.documentElement);
    const v = (n, f) => (s.getPropertyValue(n).trim() || f);
    return {
      accent: v('--accent', '#4f8cff'),
      green:  v('--green',  '#22c55e'),
      red:    v('--red',    '#ef4444'),
      yellow: v('--yellow', '#f59e0b'),
      violet: v('--violet', '#a78bfa'),
      grid:   v('--border', '#232b3d'),
      text:   v('--text-2', '#97a1b6'),
      text2:  v('--text',   '#e6ebf5')
    };
  },

  optionsBase() {
    const c = this.couleurs();
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: c.text, font: { size: 11 } } },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-4').trim() || '#1f2637',
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-2').trim() || '#2d364a',
          borderWidth: 1,
          titleColor: c.text2,
          bodyColor: c.text2,
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { color: c.grid, drawBorder: false },
          ticks: { color: c.text, font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: c.grid, drawBorder: false },
          ticks: { color: c.text, font: { size: 10 } }
        }
      }
    };
  },

  courbeCapital(canvasId, points, capitalInitial) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = points.map(p => p.date.slice(0, 10));
    const data = points.map(p => p.capital);
    const o = this.optionsBase();
    o.scales.y.ticks.callback = v => Utils.formatMonnaie(v, 0);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Capital', data,
          borderColor: c.accent,
          backgroundColor: c.accent + '22',
          borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true
        }]
      },
      options: o
    });
  },

  pnlCumule(canvasId, points) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = points.map(p => p.date.slice(0, 10));
    const data = points.map(p => p.pnlCumule);
    const o = this.optionsBase();
    o.scales.y.ticks.callback = v => Utils.formatMonnaie(v, 0);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'P&L cumule', data,
          borderColor: c.green,
          backgroundColor: c.green + '22',
          borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true
        }]
      },
      options: o
    });
  },

  drawdown(canvasId, points) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = points.map(p => p.date.slice(0, 10));
    const data = points.map(p => p.drawdownPct);
    const o = this.optionsBase();
    o.scales.y.ticks.callback = v => v.toFixed(1) + '%';

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Drawdown %', data,
          borderColor: c.red,
          backgroundColor: c.red + '26',
          borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true
        }]
      },
      options: o
    });
  },

  distributionR(canvasId, buckets) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = Object.keys(buckets);
    const data = Object.values(buckets);
    const colors = labels.map(l =>
      (l.includes('-') || l.includes('<'))
        ? this.hexA(c.red, 0.6)
        : this.hexA(c.green, 0.6)
    );
    const o = this.optionsBase();
    o.plugins.legend.display = false;

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
      options: o
    });
  },

  barresParActif(canvasId, actifsStats) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = Object.keys(actifsStats);
    const pnl = labels.map(a => actifsStats[a].pnl);
    const o = this.optionsBase();
    o.plugins.legend.display = false;
    o.scales.y.ticks.callback = v => Utils.formatMonnaie(v, 0);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: pnl,
          backgroundColor: pnl.map(v => v >= 0 ? this.hexA(c.green, 0.65) : this.hexA(c.red, 0.65)),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: o
    });
  },

  pnlMensuel(canvasId, parMois) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const labels = Object.keys(parMois).sort();
    const pnl = labels.map(m => parMois[m].reduce((s, t) => s + Utils.nombre(t.resultat), 0));
    const o = this.optionsBase();
    o.plugins.legend.display = false;
    o.scales.y.ticks.callback = v => Utils.formatMonnaie(v, 0);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: pnl,
          backgroundColor: pnl.map(v => v >= 0 ? this.hexA(c.green, 0.65) : this.hexA(c.red, 0.65)),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: o
    });
  },

  barresGeneriques(canvasId, labels, data, { couleurPositive = true, formatter = null } = {}) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const c = this.couleurs();
    const o = this.optionsBase();
    o.plugins.legend.display = false;
    if (formatter) o.scales.y.ticks.callback = formatter;

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: couleurPositive
            ? data.map(v => v >= 0 ? this.hexA(c.green, 0.65) : this.hexA(c.red, 0.65))
            : this.hexA(c.accent, 0.6),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: o
    });
  },

  ligneGenerique(canvasId, labels, datasets) {
    this.detruire(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const o = this.optionsBase();
    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: o
    });
  },

  hexA(hex, alpha) {
    if (!hex) return 'rgba(79,140,255,' + alpha + ')';
    if (hex.startsWith('rgb')) {
      return hex.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
        const parts = inner.split(',').map(s => s.trim());
        return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
      });
    }
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
};