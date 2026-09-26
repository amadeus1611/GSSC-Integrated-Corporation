// Storage adapter checks: local-only load, db hydration and mirroring (with a fake per-viewer db), export and import.
// Run with: NODE_PATH=/opt/node22/lib/node_modules node qa/store.js
const { chromium } = require('playwright');
const H = require('./harness'); const { MOCK } = require('./mocks');
const chat = (id, title) => ({ id, no: 20, title, ts: Date.now(), turns: [{ role: 'user', ts: Date.now(), content: title }] });
const FAKE = ({ seed, uid }) => {
  const S = window.__FDB = Object.assign({}, seed); const u0 = window.claude.use;
  const col = { get: async () => ({ docs: Object.keys(S).map(id => ({ id, exists: true, data: () => S[id] })) }), doc: id => ({ set: async b => { S[id] = JSON.parse(JSON.stringify(b)) }, delete: async () => { delete S[id] } }) };
  window.claude.use = async n => n === 'user' ? { id: async () => uid } : n === 'db' ? { collection: p => { if (p !== 'data/users/' + uid) throw new Error('path ' + p); return col }, doc: () => ({ set: async () => {} }) } : u0(n);
};
(async () => {
  const srv = await H.serve(), url = srv.url + '/index.html', fails = [], ok = (c, m) => { if (!c) fails.push(m) };
  const b = await chromium.launch();
  async function page(local, db) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }), errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.addInitScript(l => { if (!sessionStorage.getItem('seeded')) { for (const k in l) localStorage.setItem(k, l[k]); sessionStorage.setItem('seeded', '1') } }, local);
    await p.addInitScript(MOCK); if (db) await p.addInitScript(FAKE, db);
    await p.goto(url); await p.waitForTimeout(1500); return { p, errs };
  }
  // 1. local only: a v6 library loads, the adapter reports the browser
  let { p, errs } = await page({ 'expira.v6': JSON.stringify([chat('a1', 'Local chat')]), 'expira.prefs': JSON.stringify({ name: 'Rosa' }) });
  ok(await p.evaluate(() => __KV.where()) === 'local', 'local: where');
  ok(await p.$('text=Local chat'), 'local: chat listed');
  ok((await p.textContent('#greet')).includes('Rosa'), 'local: greeting uses the pref');
  const ex = await p.evaluate(() => __KV.exportAll());
  ok(ex.format === 'expira.library' && ex.chats.length === 1 && !ex.chats.some(c => c.example), 'export: shape');
  ok(errs.length === 0, 'local errors: ' + errs); await p.close();
  // 2. no name set: neutral greeting and account row
  ({ p, errs } = await page({}));
  ok(!/Duke/.test(await p.textContent('body')), 'neutral: no built-in name');
  ok((await p.textContent('#me')).includes('Your account'), 'neutral: account row');
  // 3. import into a fresh library
  await p.evaluate(e => __KV.importAll(e), ex); await p.waitForTimeout(300);
  ok(await p.$('text=Local chat'), 'import: chat listed');
  ok((await p.textContent('#greet')).includes('Rosa'), 'import: prefs applied');
  ok(await p.evaluate(() => { try { __KV.importAll({ format: 'x' }); return false } catch (e) { return true } }), 'import: rejects a foreign file');
  ok(errs.length === 0, 'import errors: ' + errs); await p.close();
  // 4. db: the durable copy wins, local-only chats are sent up, changes mirror
  ({ p, errs } = await page({ 'expira.v6': JSON.stringify([chat('l1', 'Only in this browser')]) }, { uid: 'u42', seed: { 'c:d1': { v: chat('d1', 'From the durable copy') }, 'k:prefs': { v: { name: 'Ana' } } } }));
  ok(await p.evaluate(() => __KV.where()) === 'db', 'db: where');
  ok(await p.$('text=From the durable copy') && await p.$('text=Only in this browser'), 'db: merged library');
  ok((await p.textContent('#greet')).includes('Ana'), 'db: prefs hydrated');
  await p.waitForTimeout(800);
  let D = await p.evaluate(() => Object.keys(__FDB).sort());
  ok(D.includes('c:l1') && !D.includes('c:example'), 'db: local chat mirrored, example kept out: ' + D);
  await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('expira.v6')).filter(c => c.id !== 'l1'); __KV.put('chats', c) }); await p.waitForTimeout(800);
  D = await p.evaluate(() => Object.keys(__FDB)); ok(!D.includes('c:l1'), 'db: delete mirrored');
  ok(errs.length === 0, 'db errors: ' + errs); await p.close();
  await b.close(); srv.close();
  console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'store: all checks pass'); process.exit(fails.length ? 1 : 0);
})();
