// Lab capture for Gate A: page screenshots, exact pour frames (animations paused at set times), and a real-speed frame-timing run.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/lab/cast.js   → qa/out/lab/
// Then: python3 expira-system/console/qa/lab/strips.py to assemble filmstrips and GIFs.
const H = require('../harness'), path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'out', 'lab'); fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
const OPEN_T = [...Array(27)].map((_, i) => i * 10);   // 0..260 ms
const CLOSE_T = [...Array(39)].map((_, i) => i * 10);  // 0..380 ms
(async () => {
  const srv = await H.serve(); const report = { errors: {}, validators: {}, timing: {} };
  for (const th of ['light', 'dark']) {
    const { b, p, errs } = await H.open(srv.url + '/qa/lab/index.html?theme=' + th, { w: 1280, h: 900, settle: 1200 });
    await p.waitForFunction(() => window.__labReady && window.__pour, null, { timeout: 10000 });
    report.validators[th] = await p.$$eval('#pal .th', els => els.map(e => ({ cat: e.dataset.cat, ord: e.dataset.ord })));
    await p.screenshot({ path: path.join(OUT, `lab_${th}.png`), fullPage: true });
    if (th === 'light') {
      // exact frames, per candidate and stage theme
      const stages = await p.$$('.stage');
      for (const st of stages) {
        const k = await st.getAttribute('data-k'), t2 = await st.getAttribute('data-th2'); await st.scrollIntoViewIfNeeded();
        const grab = async (phase, T) => {
          for (const t of T) {
            await p.evaluate(({ k, t2, t }) => { const st = document.querySelector(`.stage[data-k="${k}"][data-th2="${t2}"]`); st.querySelector('.pour').getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t }) }, { k, t2, t });
            await st.screenshot({ path: path.join(OUT, 'frames', `${k}_${t2}_${phase}_${String(t).padStart(3, '0')}.png`) });
          }
          await p.evaluate(({ k, t2 }) => document.querySelector(`.stage[data-k="${k}"][data-th2="${t2}"] .pour`).getAnimations({ subtree: true }).forEach(a => a.play()), { k, t2 });
          await p.waitForTimeout(700);
        };
        await p.evaluate(({ k, t2 }) => { const st = document.querySelector(`.stage[data-k="${k}"][data-th2="${t2}"]`), c = window.__pour.CTL.get(st); c.open(...window.__pour.chipPt(st)); st.querySelector('.pour').getAnimations({ subtree: true }).forEach(a => a.pause()) }, { k, t2 });
        await grab('open', OPEN_T);
        await p.evaluate(({ k, t2 }) => { const st = document.querySelector(`.stage[data-k="${k}"][data-th2="${t2}"]`), c = window.__pour.CTL.get(st); c.close(); st.querySelector('.pour').getAnimations({ subtree: true }).forEach(a => a.pause()) }, { k, t2 });
        await grab('close', CLOSE_T);
      }
      // real speed: frame intervals and long frames while every pour opens then closes (6 stages at once, worst case)
      await p.evaluate(() => scrollTo(0, 0));
      report.timing = await p.evaluate(async () => {
        const iv = [], L = []; let last = performance.now(), run = true;
        const po = new PerformanceObserver(l => l.getEntries().forEach(e => L.push(Math.round(e.duration)))); try { po.observe({ type: 'long-animation-frame' }) } catch (e) { }
        const f = t => { iv.push(t - last); last = t; if (run) requestAnimationFrame(f) }; requestAnimationFrame(f);
        const all = () => window.__pour.CTL.forEach((c, st) => c.pour.isOpen ? c.close() : c.open(...window.__pour.chipPt(st)));
        for (let i = 0; i < 6; i++) { all(); await new Promise(r => setTimeout(r, 450)) }
        run = false; po.disconnect(); iv.shift();
        const s = iv.slice().sort((a, b) => a - b); return { frames: iv.length, p50: +s[Math.floor(s.length * .5)].toFixed(1), p95: +s[Math.floor(s.length * .95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over33ms: iv.filter(x => x > 33.4).length, longAnimationFrames: L };
      });
    }
    report.errors[th] = errs; await b.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1)); console.log(JSON.stringify(report)); srv.close();
  process.exit(Object.values(report.errors).some(e => e.length) ? 1 : 0);
})();
