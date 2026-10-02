// Phase 0 audit probe 2: pour timeline for #optMenu and Dispatch stillness over time.
const H = require('./harness');
(async () => {
  const srv = await H.serve(); const { b, p, errs } = await H.open(srv.url + '/index.html', { settle: 1500 });
  await H.example(p); await p.waitForTimeout(1500);
  await p.evaluate(()=>{window.__go=null});
  const bb = await p.$eval('#optBtn', e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] });
  await p.mouse.move(bb[0], bb[1]);
  const tlP = p.evaluate(async () => {
    const m = document.querySelector('#optMenu'), out = []; await new Promise(r => document.addEventListener('pointerdown', r, { once: true })); const t0 = performance.now();
    await new Promise(res => { const f = () => { const t = performance.now() - t0; const cs = getComputedStyle(m); out.push([Math.round(t), cs.opacity, cs.visibility, (cs.clipPath || '').slice(0, 24), m.getAnimations().length, m.getAnimations().map(a => Math.round(a.effect.getComputedTiming().duration)).join('/')]); t < 1400 ? requestAnimationFrame(f) : res() }; requestAnimationFrame(f) });
    const openAt = out.find(r => r[2] === 'visible' && +r[1] > 0.05); const settled = [...out].reverse().find(r => r[4] > 0);
    // close
    const out2 = []; const t1 = performance.now(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(res => { const f = () => { const t = performance.now() - t1; const cs = getComputedStyle(m); out2.push([Math.round(t), cs.opacity, cs.visibility, m.getAnimations().length]); t < 1200 ? requestAnimationFrame(f) : res() }; requestAnimationFrame(f) });
    const hidden = out2.find(r => r[2] === 'hidden' || +r[1] < .02);
    return { first: out.slice(0, 4), openAt, lastAnimating: settled, sample: out.filter((_, i) => i % 8 === 0), closeHiddenAt: hidden, closeSample: out2.filter((_, i) => i % 8 === 0) };
  });
  await p.waitForTimeout(50); await p.mouse.down(); await p.mouse.up(); const tl = await tlP;
  console.log(JSON.stringify(tl));
  await p.evaluate(() => { window.__raf = 0; const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { window.__raf++; return r(f) } });
  await p.click('#dspBtn');
  const st = [];
  for (let i = 0; i < 6; i++) { const a = await p.evaluate(() => window.__raf); await p.waitForTimeout(2000); const c = await p.evaluate(() => window.__raf); st.push(((c - a) / 2).toFixed(1)) }
  console.log('dispatch rAF/s every 2s:', st.join(' '));
  const who = await p.evaluate(() => (window.__FM ? [...window.__FM].map(m => ({ cls: m.constructor.name, raf: !!m.raf, alpha: m.alpha, pl: (m.pl || []).length, vis: m.vis })) : 'no __FM'));
  console.log('maps', JSON.stringify(who)); console.log('errs', errs);
  await b.close(); srv.close();
})();
