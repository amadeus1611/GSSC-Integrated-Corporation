// Performance: a Chrome trace of a full mock run, then checks while settled.
// Run with: NODE_PATH=/opt/node22/lib/node_modules node qa/perf.js   (trace goes to qa/out/perf/, git-ignored)
const H = require('./harness'), path = require('path');
const PROBE = () => {
  const raf = window.requestAnimationFrame.bind(window); window.__P = { raf: 0, stacks: {}, long: [] };
  window.requestAnimationFrame = f => { if (!f.__probe) { __P.raf++; const s = (new Error().stack || '').split('\n')[2] || '?'; const k = s.trim().replace(/\(.*index\.html:/, '(:').slice(0, 90); __P.stacks[k] = (__P.stacks[k] || 0) + 1 } return raf(f) };
  try { new PerformanceObserver(l => l.getEntries().forEach(e => __P.long.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: true }) } catch (e) { }
  window.__frames = ms => new Promise(res => { const d = []; let last = performance.now(), end = last + ms; const step = t => { d.push(t - last); last = t; if (t < end) raf(stepP); else res(d) }; const stepP = t => step(t); stepP.__probe = 1; raf(stepP) });
};
(async () => {
  const srv = await H.serve(); const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m) };
  const { chromium } = require('playwright'); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const { MOCK, WRAP } = require('./mocks'); await p.addInitScript(PROBE); await p.addInitScript(MOCK); await p.addInitScript(WRAP);
  await p.goto(srv.url + '/index.html'); await p.waitForTimeout(1500);
  const idle = async (label) => {
    await p.mouse.move(700, 880); await p.waitForTimeout(2500); await p.evaluate(() => { __P.raf = 0; __P.stacks = {}; __P.long = [] });
    const fr = await p.evaluate(() => __frames(3000)); const r = await p.evaluate(() => ({ raf: __P.raf, stacks: __P.stacks, long: __P.long.length, maps: [...(window.__FM || [])].map(m => ({ id: m.host && m.host.id || m.host?.className, raf: !!m.raf, vis: m.vis ?? m.visible })) }));
    const worst = Math.max(...fr.slice(1)); ok(worst <= 50, `${label}: worst frame ${worst.toFixed(1)} ms while settled`);
    ok(r.long === 0, `${label}: ${r.long} long tasks while settled`);
    ok(r.raf <= 2, `${label}: ${r.raf} page rAF callbacks in 3 s while settled` + (r.raf > 2 ? ' ' + JSON.stringify(r.stacks) : ''));
    const awake = r.maps.filter(m => m.raf); ok(!awake.length, `${label}: maps asleep (${r.maps.length} maps${awake.length ? ', awake: ' + JSON.stringify(awake) : ''})`);
  };
  await idle('start');
  await H.example(p); await idle('example');
  await b.startTracing(p, { path: path.join(__dirname, 'out/perf/trace.json'), screenshots: false, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing'] });
  const t0 = Date.now(); await H.brief(p); const runMs = Date.now() - t0;
  await b.stopTracing();
  const lt = await p.evaluate(() => __P.long.map(e => Math.round(e.d)));
  console.log(`run: ${(runMs / 1000).toFixed(1)} s, long tasks during run: ${lt.length}${lt.length ? ' (max ' + Math.max(...lt) + ' ms)' : ''}`);
  await idle('after run');
  await p.evaluate(() => document.querySelector('.run .vs [data-view="map"]')?.click()); await p.waitForTimeout(2500); await idle('card map');
  await p.click('#dspBtn').catch(() => {}); await p.waitForTimeout(8000); await idle('Dispatch open'); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  // off-screen: scroll the run card's map out of view mid-run and check it sleeps
  await p.click('#newChat'); await p.fill('#prompt', 'Price twelve rooms of drapery for a small hotel.'); await p.keyboard.press('Enter');
  await p.waitForTimeout(6000);
  const off = await p.evaluate(async () => { const M = [...(window.__FM || [])]; const sc = [...document.querySelectorAll('#main *')].find(e => e.scrollHeight > e.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (sc) { sc.style.paddingBottom = '4000px'; sc.scrollTop = 99999 } await new Promise(r => setTimeout(r, 1200)); return M.map(m => { const r = m.host.getBoundingClientRect(); return { on: r.bottom > 0 && r.top < innerHeight, raf: !!m.raf } }) });
  const bad = off.filter(m => !m.on && m.raf); ok(!bad.length, `off-screen: ${off.filter(m => !m.on).length} maps off-screen, ${bad.length} still drawing`);
  ok(errs.length === 0, 'page errors: ' + errs.length + ' ' + errs.slice(0, 2));
  await b.close(); srv.close(); console.log(fails.length ? `\n${fails.length} FAIL` : '\nperf: all checks pass'); process.exit(fails.length ? 1 : 0);
})();
