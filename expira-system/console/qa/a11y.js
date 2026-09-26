// Accessibility pass: axe-core rules on each surface in both themes, a keyboard walk, and reduced motion.
// axe-core is not vendored: install it outside the repo and point AXE at axe.min.js, e.g.
//   npm i --prefix /tmp/axe axe-core && AXE=/tmp/axe/node_modules/axe-core/axe.min.js NODE_PATH=/opt/node22/lib/node_modules node qa/a11y.js
const H = require('./harness'), fs = require('fs');
const AXE = process.env.AXE && fs.existsSync(process.env.AXE) ? fs.readFileSync(process.env.AXE, 'utf8') : null;
(async () => {
  const srv = await H.serve(); const out = {};
  for (const dark of [false, true]) {
    const th = dark ? 'dark' : 'light'; const { b, p, errs } = await H.open(srv.url + '/index.html', { dark });
    const scan = async (name) => {
      if (!AXE) return; await p.waitForTimeout(700);
      if (!await p.evaluate(() => !!window.axe)) await p.addScriptTag({ content: AXE });
      const r = await p.evaluate(async () => { const r = await axe.run(document, { resultTypes: ['violations'], rules: { region: { enabled: false } } }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, eg: v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.any[0]?.message ? ' :: ' + n.any[0].message.slice(0, 110) : '')) })) });
      for (const v of r) { const k = `${v.id} (${v.impact})`; (out[k] = out[k] || []).push(`${th}/${name} ×${v.n}: ${v.eg.join(' | ')}`) }
    };
    await scan('example');
    await p.click('.run .run-h').catch(() => {}); await scan('run open');
    await p.evaluate(() => document.querySelector('.run .vs [data-view="map"]')?.click()); await scan('card map');
    await p.click('#newChat'); await scan('start');
    await p.click('#me'); await scan('account'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await p.keyboard.press('Control+Comma'); for (const t of ['general', 'appearance', 'map', 'briefs', 'files', 'library', 'kernel', 'about']) { await p.click(`#setMenu [data-tab="${t}"]`); await scan('settings:' + t) } await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await p.keyboard.press('Control+k'); await scan('palette'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await H.example(p); await p.click('#dspBtn').catch(() => {}); await p.waitForTimeout(6000); await scan('dispatch'); await p.keyboard.press('Escape');
    if (errs.length) console.log(th + ' page errors', errs.slice(0, 3));
    await b.close();
  }
  // keyboard walk: every Tab stop is visible and shows a focus indicator
  { const { b, p } = await H.open(srv.url + '/index.html'); await H.example(p); await p.mouse.move(1, 1);
    const bad = [], seen = new Set(); let loops = 0;
    for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(90);
      const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect();
        const lab = (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20) + '"';
        const ring = c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 || c.boxShadow !== 'none' || e.matches(':focus-visible') && (c.backgroundColor !== 'rgba(0, 0, 0, 0)');
        const named = !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.textContent.trim() || e.getAttribute('title') || e.placeholder || e.labels?.length);
        return { lab, ring, named, vis: r.width > 0 && r.height > 0 } });
      if (!r) continue; if (seen.has(r.lab)) { if (++loops > 3) break; continue } seen.add(r.lab);
      if (!r.vis) bad.push('hidden stop ' + r.lab); else if (!r.ring) bad.push('no ring ' + r.lab); if (!r.named) bad.push('no name ' + r.lab) }
    out['keyboard walk'] = [`${seen.size} stops`, ...bad]; await b.close() }
  // reduced motion: nothing loops
  { const { b, p } = await H.open(srv.url + '/index.html', { reduce: true }); await H.example(p); await p.waitForTimeout(1500);
    const inf = await p.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity && a.playState === 'running').map(a => (a.animationName || a.constructor.name) + ' on ' + (a.effect.target?.id || a.effect.target?.className))); out['reduced motion: infinite animations'] = inf.length ? inf : ['none']; await b.close() }
  srv.close(); if (!AXE) console.log('(axe-core not found: set AXE to run the rule scan)');
  for (const [k, v] of Object.entries(out)) { console.log('\n' + k); v.slice(0, process.env.ALL ? 999 : 8).forEach(x => console.log('  ' + x)); if (!process.env.ALL && v.length > 8) console.log(`  … ${v.length - 8} more`) }
})();
