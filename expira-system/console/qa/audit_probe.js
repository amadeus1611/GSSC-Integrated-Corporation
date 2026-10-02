// Phase 0 audit probe: screenshots + runtime stillness/rAF/animation measurements, light and dark.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/audit_probe.js
const H = require('./harness'), path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'out', 'audit'); fs.mkdirSync(OUT, { recursive: true });
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });
const COUNT = () => { window.__raf = 0; const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { window.__raf++; return r(f) } };
async function idle(p, ms = 3000) {
  return p.evaluate(async ms => {
    const a0 = window.__raf; await new Promise(r => setTimeout(r, ms));
    const anims = document.getAnimations().filter(a => a.playState === 'running');
    const desc = anims.map(a => { const t = a.effect && a.effect.target; const n = a.animationName || (a.constructor.name); return (n) + ' @ ' + (t ? (t.id ? '#' + t.id : (t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className) || t.tagName) : '?') });
    const c = {}; desc.forEach(d => c[d] = (c[d] || 0) + 1);
    return { rafPerSec: +((window.__raf - a0) / (ms / 1000)).toFixed(1), running: anims.length, byName: c };
  }, ms);
}
async function longFrames(p, ms = 3000) {
  return p.evaluate(ms => new Promise(res => { const L = []; let po; try { po = new PerformanceObserver(l => l.getEntries().forEach(e => L.push(Math.round(e.duration)))); po.observe({ type: 'long-animation-frame', buffered: false }) } catch (e) { } setTimeout(() => { po && po.disconnect(); res(L) }, ms) }), ms);
}
(async () => {
  const srv = await H.serve(); const R = {};
  for (const dark of [false, true]) {
    const th = dark ? 'dark' : 'light', r = R[th] = {};
    const { b, p, errs } = await H.open(srv.url + '/index.html', { dark, settle: 1500 });
    await p.evaluate(COUNT);
    await shot(p, `01_start_${th}`); r.start = await idle(p);
    await H.example(p); await p.waitForTimeout(2500); await shot(p, `02_example_${th}`); r.example = await idle(p); r.exampleLongFrames = await longFrames(p);
    // dispatch
    const dsp = await p.$('#dspBtn'); if (dsp) { await dsp.click(); await p.waitForTimeout(2500); await shot(p, `03_dispatch_${th}`); r.dispatch = await idle(p); await p.keyboard.press('Escape'); await p.waitForTimeout(800) }
    // options menu open (pour) frames
    const ob = await p.$('#optBtn') || await p.$('[aria-controls=optMenu]');
    if (ob) { const fr = await H.cast(p, async () => { await ob.click(); await p.waitForTimeout(900) }); r.pourFrames = fr.length; fr.filter((_, i) => i % Math.max(1, Math.floor(fr.length / 6)) === 0).slice(0, 6).forEach((f, i) => fs.writeFileSync(path.join(OUT, `04_pour_${th}_${i}_${f.t.toFixed(2)}s.jpg`), Buffer.from(f.d, 'base64'))); await shot(p, `04_optmenu_${th}`); await p.keyboard.press('Escape'); await p.waitForTimeout(600) }
    // sidebar fold/unfold: record the fold and unfold button positions across the motion
    r.fold = await p.evaluate(async () => {
      const q = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), getComputedStyle(e).opacity, getComputedStyle(e).visibility, getComputedStyle(e).display] };
      const a = { before: { fold: q('#fold'), unfold: q('#unfold') } }; document.querySelector('#fold').click(); const tr = [];
      for (let i = 0; i < 8; i++) { await new Promise(r => setTimeout(r, 90)); tr.push({ fold: q('#fold'), unfold: q('#unfold') }) } a.during = tr; document.querySelector('#unfold').click(); await new Promise(r => setTimeout(r, 900)); a.after = { fold: q('#fold'), unfold: q('#unfold') }; return a
    });
    // settings
    await p.keyboard.press('Control+Comma').catch(() => { }); await p.waitForTimeout(1200); await shot(p, `05_settings_${th}`); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    // mock run
    await H.brief(p); await shot(p, `06_run_${th}`); r.afterRun = await idle(p, 4000); r.afterRunLongFrames = await longFrames(p);
    // contrast of text tokens against bg/panel
    r.contrast = await p.evaluate(() => {
      const cs = getComputedStyle(document.documentElement), g = v => cs.getPropertyValue(v).trim();
      const rgb = h => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3) };
      const lum = a => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }; return .2126 * f(a[0]) + .7152 * f(a[1]) + .0722 * f(a[2]) };
      const cr = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2) };
      const o = {}; for (const f of ['--ink', '--text', '--soft', '--mute', '--gold', '--gold-2', '--ok', '--bad', '--warn']) for (const bg of ['--bg', '--panel', '--side', '--well']) o[f + ' on ' + bg] = cr(g(f), g(bg)); return o
    });
    r.errs = errs; await b.close();
  }
  fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); srv.close();
})();
