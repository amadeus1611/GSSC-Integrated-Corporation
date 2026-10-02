// Which selector pairs really match one element? Walks the UI states on the base build and tests each pair.
// NODE_PATH=/opt/node22/lib/node_modules node qa/tools/comatch.js [page=.base.html]   (reads/writes qa/out/)
const H = require('../harness'), { wait, STATES } = require('../states'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'out');
(async () => {
  const pairs = JSON.parse(fs.readFileSync(path.join(OUT, 'pairs.json'), 'utf8'));
  const srv = await H.serve(), real = new Set();
  for (const dark of [false, true]) {
    const { b, p } = await H.open(srv.url + '/' + (process.argv[2] || '.base.html'), { dark, reduce: true });
    for (const [name, fn] of STATES) {
      await fn(p); await wait(p, 500);
      const hit = await p.evaluate(pairs => {
        const clean = s => s.replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+|first-line|first-letter)\b/g, '')
          .replace(/:(hover|focus|focus-visible|focus-within|active|visited|target|checked|disabled|enabled|empty|placeholder-shown)\b/g, '').trim() || '*';
        const q = s => { try { return [...document.querySelectorAll(clean(s))] } catch (e) { return null } };
        const out = [];
        pairs.forEach(([a, b2], i) => { const A = q(a); if (A === null) { out.push(i); return } if (!A.length) return;
          try { const cb = clean(b2); if (A.some(e => e.matches(cb))) out.push(i) } catch (e) { out.push(i) } });
        return out;
      }, pairs);
      hit.forEach(i => real.add(i));
    }
    await b.close();
  }
  srv.close();
  fs.writeFileSync(path.join(OUT, 'real_pairs.json'), JSON.stringify([...real].sort((x, y) => x - y).map(i => pairs[i])));
  console.log(`${real.size} of ${pairs.length} selector pairs co-match an element`);
})();
