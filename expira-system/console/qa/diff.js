// Behaviour diff: page A vs page B, for the example chat, the Dispatch and one mock run, in light and dark.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/diff.js A.html B.html
// Paths are relative to expira-system/console (e.g. qa/out/base.html index.html).
// Reduced motion by default (FULL_MOTION=1 for full motion); randomness and the clock are frozen so two identical builds give identical DOM and pixels; a real
// change shows as a DOM diff (first lines printed) and a pixel count per shot. Shots go to qa/out/diff/.
const H = require('./harness'), path = require('path'), fs = require('fs');
const FREEZE = () => {
  let s = 20260925; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const T0 = Date.UTC(2026, 8, 25, 10, 0, 0); let off = 0; const RD = Date;
  class D extends RD { constructor(...a) { a.length ? super(...a) : super(T0 + off) } static now() { return T0 + off } }
  window.Date = D; setInterval(() => off += 1000, 1000);
};
const OUT = path.join(__dirname, 'out', 'diff'); fs.mkdirSync(OUT, { recursive: true });
// the DOM as text: tags, ids and classes of every element under #app plus the overlays, digits masked
const dom = p => p.evaluate(() => {
  const walk = (e, d) => { let s = '  '.repeat(d) + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).sort().join('.') : '');
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 80); if (own) s += ' "' + own + '"';
    return [s, ...[...e.children].filter(c => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE').flatMap(c => walk(c, d + 1))] };
  return walk(document.body, 0).join('\n').replace(/\d+(\.\d+)?/g, '#');
});
async function shots(file, dark) {
  const { b, p, errs } = await H.open(SRV.url + '/' + file, { dark, reduce: !process.env.FULL_MOTION });
  await p.addInitScript(FREEZE); await p.reload(); await p.waitForTimeout(1000);
  const r = {};
  await H.example(p); r.example = [await dom(p), await shot(p)];
  await p.keyboard.press('Alt+KeyL'); await p.waitForTimeout(1500); r.dispatch = [await dom(p), await shot(p)];
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  await H.brief(p); r.run = [await dom(p), await shot(p)];
  r.errs = errs; await b.close(); return r;
}
async function pixels(a, b) {
  const { chromium } = require('playwright'); const br = await chromium.launch(); const p = await br.newPage();
  const n = await p.evaluate(async ([a, b]) => {
    const img = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s });
    const [A, B] = await Promise.all([img(a), img(b)]); if (A.width !== B.width || A.height !== B.height) return -1;
    const px = I => { const c = new OffscreenCanvas(I.width, I.height), x = c.getContext('2d'); x.drawImage(I, 0, 0); return x.getImageData(0, 0, I.width, I.height).data };
    const x = px(A), y = px(B); let d = 0; for (let i = 0; i < x.length; i += 4) if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2]) d++; return d;
  }, [a.toString('base64'), b.toString('base64')]);
  await br.close(); return n;
}
let SRV;
const shot = async p => { await p.waitForTimeout(1200); return p.screenshot({ animations: 'disabled' }) };
(async () => {
  const [A, B] = process.argv.slice(2); if (!A || !B) { console.error('usage: diff.js A.html B.html'); process.exit(2) }
  SRV = await H.serve(); let same = true;
  for (const dark of [false, true]) {
    const th = dark ? 'dark' : 'light', ra = await shots(A, dark), rb = await shots(B, dark);
    for (const k of ['example', 'dispatch', 'run']) {
      const [da, sa] = ra[k], [db, sb] = rb[k];
      fs.writeFileSync(path.join(OUT, `${k}_${th}_A.png`), sa); fs.writeFileSync(path.join(OUT, `${k}_${th}_B.png`), sb);
      const la = da.split('\n'), lb = db.split('\n'); let first = -1; for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) { first = i; break }
      const px = await pixels(sa, sb); if (first >= 0 || px) same = false;
      console.log(`${th.padEnd(5)} ${k.padEnd(8)} dom ${first < 0 ? 'same' : 'DIFFERS at line ' + first} · pixels differing ${px < 0 ? 'size mismatch' : px}`);
      if (first >= 0) console.log('   A: ' + (la[first] || '∅').trim().slice(0, 140) + '\n   B: ' + (lb[first] || '∅').trim().slice(0, 140));
    }
    console.log(`${th.padEnd(5)} errors A ${ra.errs.length} · B ${rb.errs.length}`);
  }
  SRV.close(); console.log(same ? 'IDENTICAL' : 'DIFFERENT'); process.exit(0);
})();
