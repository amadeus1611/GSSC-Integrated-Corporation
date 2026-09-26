// Unit screenshots: light, dark and reduced motion for one unit's states, into qa/out/shots/<unit>/.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/shots.js <unit> [page=index.html]
// Each unit lists the states that show it; a state is [name, async p => {...}] run in order on one page.
const H = require('./harness'), path = require('path'), fs = require('fs');
const { wait, click } = require('./states');
const UNITS = {
  shell: [
    ['start', async p => { await click(p, '#newChat') }],
    ['example', async p => { await H.example(p) }],
    ['fold-mid', async p => { await p.click('#fold'); await wait(p, 170) }],
    ['folded', async p => { await wait(p, 700) }],
    ['folded-hover', async p => { await p.hover('#fold'); await wait(p, 400) }],
    ['unfold-mid', async p => { await p.click('#fold'); await wait(p, 170) }],
    ['unfolded', async p => { await p.mouse.move(900, 600); await wait(p, 700) }],
  ],
};
(async () => {
  const unit = process.argv[2], page = process.argv[3] || 'index.html';
  if (!UNITS[unit]) { console.error('units:', Object.keys(UNITS).join(', ')); process.exit(2) }
  const out = path.join(__dirname, 'out', 'shots', unit); fs.mkdirSync(out, { recursive: true });
  const srv = await H.serve(); let bad = 0;
  for (const [tag, o] of [['light', {}], ['dark', { dark: true }], ['reduce', { reduce: true }]]) {
    const { b, p, errs } = await H.open(srv.url + '/' + page, o);
    for (const [name, fn] of UNITS[unit]) { await fn(p); await p.screenshot({ path: path.join(out, `${tag}_${name}.png`) }) }
    console.log(tag.padEnd(6), 'errors:', errs.length, errs.slice(0, 3)); bad += errs.length; await b.close();
  }
  srv.close(); process.exit(bad ? 1 : 0);
})();
