/* ============================================================
   THEME - Gestion du theme clair / sombre
   ------------------------------------------------------------
   Version : 3.0
   Derniere mise a jour : Application locale, sans Synchro
   ============================================================ */
const Theme = (() => {
  const KEY = 'tj_parametres';

  function lire() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      return p.theme === 'clair' ? 'clair' : 'sombre';
    } catch { return 'sombre'; }
  }

  function ecrire(theme) {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      p.theme = theme;
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch (e) {}
  }

  function appliquer(theme) {
    const t = (theme === 'clair') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
  }

  function iconeSoleil() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  }

  function iconeLune() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
  }

  function bouton() {
    let b = document.getElementById('btn-theme');
    if (!b) {
      b = document.createElement('button');
      b.id = 'btn-theme';
      b.type = 'button';
      b.className = 'btn btn-ghost theme-toggle';
      b.title = 'Basculer le theme';
      b.setAttribute('aria-label', 'Basculer le theme');
      b.addEventListener('click', basculer);
      const zone = document.querySelector('.topbar-actions');
      if (zone) zone.insertBefore(b, zone.firstChild);
    }
    return b;
  }

  function majBouton() {
    const b = bouton();
    if (!b) return;
    const t = lire();
    b.innerHTML = t === 'clair' ? iconeLune() : iconeSoleil();
    b.setAttribute('aria-label', t === 'clair' ? 'Passer en theme sombre' : 'Passer en theme clair');
  }

  function rafraichirGraphiques() {
    if (typeof Graphiques === 'undefined' || !Graphiques.instances) return;
    if (typeof Chart === 'undefined') return;

    let c;
    try { c = Graphiques.couleurs(); } catch (e) { return; }

    const root = getComputedStyle(document.documentElement);
    const bgTooltip = root.getPropertyValue('--bg-4').trim() || '#1f2637';
    const borderTooltip = root.getPropertyValue('--border-2').trim() || '#2d364a';

    Object.keys(Graphiques.instances).forEach(function(id) {
      const chart = Graphiques.instances[id];
      if (!chart || !chart.options) return;

      if (chart.options.scales) {
        ['x', 'y'].forEach(function(axis) {
          const s = chart.options.scales[axis];
          if (!s) return;
          if (s.grid) s.grid.color = c.grid;
          if (s.ticks) s.ticks.color = c.text;
        });
      }

      if (chart.options.plugins) {
        if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
          chart.options.plugins.legend.labels.color = c.text;
        }
        if (chart.options.plugins.tooltip) {
          chart.options.plugins.tooltip.backgroundColor = bgTooltip;
          chart.options.plugins.tooltip.borderColor = borderTooltip;
          chart.options.plugins.tooltip.titleColor = c.text2;
          chart.options.plugins.tooltip.bodyColor = c.text2;
        }
      }

      (chart.data.datasets || []).forEach(function(ds) {
        const label = String(ds.label || '').toLowerCase();

        if (label.indexOf('capital') !== -1) {
          ds.borderColor = c.accent;
          ds.backgroundColor = c.accent + '22';
        } else if (label.indexOf('p&l') !== -1 || label.indexOf('pnl') !== -1) {
          ds.borderColor = c.green;
          ds.backgroundColor = c.green + '22';
        } else if (label.indexOf('drawdown') !== -1) {
          ds.borderColor = c.red;
          ds.backgroundColor = c.red + '26';
        } else if (label.indexOf('risque') !== -1) {
          ds.borderColor = c.red;
        } else if (chart.config.type === 'bar') {
          ds.backgroundColor = (ds.data || []).map(function(v) {
            return v >= 0 ? Graphiques.hexA(c.green, 0.65) : Graphiques.hexA(c.red, 0.65);
          });
        }
      });

      try { chart.update('none'); } catch (e) {}
    });
  }

  function rafraichirWidgetsTiers() {
    try {
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { theme: lire() }
      }));
    } catch (e) {}
  }

  function basculer() {
    const actuel = lire();
    const suivant = actuel === 'clair' ? 'sombre' : 'clair';

    ecrire(suivant);
    appliquer(suivant);
    majBouton();
    rafraichirGraphiques();
    rafraichirWidgetsTiers();
  }

  function init() {
    appliquer(lire());
    majBouton();
  }

  return { init, lire, ecrire, appliquer, basculer, majBouton, rafraichirGraphiques };
})();

document.addEventListener('DOMContentLoaded', () => Theme.init());