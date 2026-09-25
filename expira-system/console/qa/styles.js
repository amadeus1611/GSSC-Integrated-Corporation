// Computed-style diff: every element (and its ::before/::after) in many UI states, page A vs page B.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/styles.js A.html B.html [--full]
// It proves a CSS refactor changed nothing: same DOM path -> same computed style, in both themes.
// Reduced motion, frozen randomness and a frozen clock keep two runs of one build identical.
const H = require('./harness'), path = require('path'), fs = require('fs');
const FREEZE = () => {
  let s = 20260925; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const T0 = Date.UTC(2026, 8, 25, 10, 0, 0); let off = 0; const RD = Date;
  class D extends RD { constructor(...a) { a.length ? super(...a) : super(T0 + off) } static now() { return T0 + off } }
  window.Date = D; setInterval(() => off += 1000, 1000);
};
const SNAP = () => {
  const skip = /^$/; const out = {};
  const pathOf = e => { const p = []; for (; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) { let i = 0, s = e; while ((s = s.previousElementSibling)) i++; p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ':' + i) } return p.join('>') };
  const ser = cs => { const o = []; for (let i = 0; i < cs.length; i++) { const k = cs[i]; if (!skip.test(k)) o.push(k + ':' + cs.getPropertyValue(k).replace(/url\("?data:[^)]*\)/g, 'url(data)')) } return o.sort().join(';') };
  for (const e of [document.documentElement, ...document.querySelectorAll('body *')]) {
    if (e.closest('svg') && e.tagName !== 'svg') continue;
    const p = pathOf(e) || 'html'; out[p] = ser(getComputedStyle(e));
    for (const pe of ['::before', '::after']) { const cs = getComputedStyle(e, pe); if (cs.content && cs.content !== 'none' && cs.content !== 'normal') out[p + pe] = ser(cs) }
  }
  return out;
};
const { wait, stable, click, STATES } = require('./states');
async function run(file, dark, full) {
  const { b, p, errs } = await H.open(SRV.url + '/' + file, { dark, reduce: !full });
  await p.addInitScript(FREEZE); await p.reload(); await wait(p, 1200);
  const r = {};
  for (const [name, fn] of STATES) { await fn(p); await p.mouse.move(1439, 899); await wait(p, 700); await stable(p); r[name] = await p.evaluate(SNAP) }
  r.errs = errs; await b.close(); return r;
}
let SRV;
(async () => {
  const [A, B] = process.argv.slice(2).filter(x => !x.startsWith('--')); const full = process.argv.includes('--full');
  if (!A || !B) { console.error('usage: styles.js A.html B.html [--full]'); process.exit(2) }
  SRV = await H.serve(); let total = 0; const report = [];
  const R = await Promise.all([false, true].flatMap(d => [run(A, d, full), run(B, d, full)]));
  for (const dark of [false, true]) {
    const th = dark ? 'dark' : 'light', ra = R[dark ? 2 : 0], rb = R[dark ? 3 : 1];
    for (const [name] of STATES) {
      const a = ra[name], b = rb[name], keys = new Set([...Object.keys(a), ...Object.keys(b)]); let n = 0;
      for (const k of keys) if (a[k] !== b[k]) {
        n++; if (process.env.DEBUG && n === 1) { const x = a[k] || '', y = b[k] || ''; let i = 0; while (x[i] === y[i]) i++; console.log('DEBUG', k, JSON.stringify(x.slice(Math.max(0, i - 120), i + 80)), '||', JSON.stringify(y.slice(Math.max(0, i - 120), i + 80))) }
        if (report.length < 400) {
          const pa = new Map((a[k] || '').split(';').map(x => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
          const pb = new Map((b[k] || '').split(';').map(x => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
          const d = [...new Set([...pa.keys(), ...pb.keys()])].filter(x => pa.get(x) !== pb.get(x)).map(x => `${x}: ${pa.get(x)} → ${pb.get(x)}`);
          report.push(`${th} ${name} ${k}\n    ${d.slice(0, 6).join('\n    ')}`);
        }
      }
      total += n; console.log(`${th.padEnd(5)} ${name.padEnd(14)} elements ${String(Object.keys(b).length).padStart(5)} · differing ${n}`);
    }
    console.log(`${th} errors A ${ra.errs.length} B ${rb.errs.length}`);
  }
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'styles_diff.txt'), report.join('\n'));
  SRV.close(); console.log(total ? `DIFFERENT: ${total} element-states (details in qa/out/styles_diff.txt)` : 'IDENTICAL'); process.exit(0);
})();
