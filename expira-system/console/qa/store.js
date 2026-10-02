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
  // the run log goes to this viewer's private subtree (the fake refuses any other path) and is never hydrated as a key
  await p.evaluate(() => __KV.log({ ts: 1, steps: [{ role: 'research', focus: 'private' }], firewall: 'clear' })); await p.waitForTimeout(300);
  D = await p.evaluate(() => Object.keys(__FDB)); ok(D.some(k => k.startsWith('r:')), 'db: run log kept in the private subtree: ' + D);
  ok(errs.length === 0, 'db errors: ' + errs); await p.close();
  // 5. db: the newer copy wins, a deleted chat stays deleted, an oversized chat stays local
  const old = chat('n1', 'Newer here'), newer = Object.assign(chat('n1', 'Newer here'), { turns: [...old.turns, { role: 'assistant', ts: Date.now() + 5000, content: 'later' }] });
  const big = Object.assign(chat('b1', 'Big chat'), { turns: [{ role: 'user', ts: Date.now() + 9000, content: 'é'.repeat(140000) }] });
  ({ p, errs } = await page({ 'expira.v6': JSON.stringify([newer, chat('z1', 'Deleted elsewhere'), big]) }, { uid: 'u7', seed: { 'c:n1': { v: old }, 'k:gone': { v: ['z1'] }, 'c:b1': { v: chat('b1', 'Big chat') } } }));
  await p.waitForTimeout(900);
  const L = await p.evaluate(() => JSON.parse(localStorage.getItem('expira.v6')));
  ok(L.find(c => c.id === 'n1').turns.length === 2, 'db: newer local copy kept');
  ok(!L.find(c => c.id === 'z1'), 'db: chat deleted elsewhere stays deleted');
  ok(L.find(c => c.id === 'b1').turns[0].content.length === 140000, 'db: oversized local chat kept');
  D = await p.evaluate(() => __FDB);
  ok(D['c:n1'].v.turns.length === 2 && !D['c:b1'] && !D['c:z1'], 'db: newer copy sent up, oversized copy removed from db');
  // 6. import: an older export does not roll back a newer chat, and a crafted feed stays text
  const evil = Object.assign(chat('x1', 'Crafted'), { turns: [{ role: 'user', ts: 1, content: 'q' }, { role: 'assistant', ts: 2, content: 'a', work: { ms: 1, tok: '<img src=x onerror="window.__pwn=3">', steps: [{ role: 'research', tier: 'high', v: '"><img src=x onerror="window.__pwn=4">', searches: '<b>x</b>', out: 'n' }], ledger: { claims: [{ id: '"><img src=x onerror="window.__pwn=5">', text: 't', v: '<img src=x onerror="window.__pwn=6">' }], audit: { flags: '<img src=x onerror="window.__pwn=7">' } }, feed: [[1, '<img src=x onerror="window.__pwn=1">', '<img src=x onerror="window.__pwn=1">']] }, imgs: [{ name: 'i', thumb: 'x" onerror="window.__pwn=8' }] }], no: '<img src=x onerror="window.__pwn=2">' });
  await p.evaluate(e => __KV.importAll({ format: 'expira.library', chats: e }), [old, evil]); await p.waitForTimeout(300);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('expira.v6')).find(c => c.id === 'n1').turns.length) === 2, 'import: older copy does not roll back');
  await p.click('text=Crafted').catch(() => {}); await p.waitForTimeout(800); await p.click('#dspBtn').catch(() => {}); await p.waitForTimeout(1500);
  ok(!(await p.evaluate(() => window.__pwn)), 'import: crafted feed does not run');
  ok(await p.evaluate(() => document.body.innerHTML.includes('&lt;img src=x')), 'import: crafted feed is shown as text');
  ok(errs.length === 0, 'db2 errors: ' + errs); await p.close();
  await b.close(); srv.close();
  console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'store: all checks pass'); process.exit(fails.length ? 1 : 0);
})();
