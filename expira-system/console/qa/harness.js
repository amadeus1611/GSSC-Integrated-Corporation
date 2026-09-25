// Playwright harness for the EXPIRA Console. Usage:
//   const H = require('./harness');
//   const srv = await H.serve();                       // serves expira-system/console on a free port
//   const {b,p,errs} = await H.open(srv.url + '/index.html', {dark:true, w:1440, h:900});
//   await H.example(p); await H.brief(p);              // open the example chat; send the mock brief
//   await b.close(); srv.close();
// Run with: NODE_PATH=/opt/node22/lib/node_modules node <script>.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const { MOCK, WRAP } = require('./mocks');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, () => res({ url: 'http://localhost:' + s.address().port, close: () => s.close() }));
  });
}
async function open(url, o = {}) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: o.w || 1440, height: o.h || 900 }, reducedMotion: o.reduce ? 'reduce' : 'no-preference' });
  // errs = uncaught page errors + console errors, minus known sandbox/font noise (doc thumbnails are sandboxed srcdoc frames; fonts are blocked offline)
  const NOISE = /Blocked script execution in 'about:blank'|ERR_CERT_AUTHORITY_INVALID|net::ERR_|Failed to load resource/;
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e))); p.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push('console: ' + m.text()) });
  if (o.dark) await p.emulateMedia({ colorScheme: 'dark' });
  await p.addInitScript(MOCK); await p.addInitScript(WRAP);
  await p.goto(url); await p.waitForTimeout(o.settle || 1000);
  return { b, p, errs };
}
const BRIEF = 'Price forty rooms of blackout drapery for Belmont hotel before December.';
async function brief(p, text = BRIEF, o = {}) {
  await p.click('#newChat'); await p.fill('#prompt', text); await p.keyboard.press('Enter');
  if (o.noWait) return;
  await p.waitForFunction(() => document.querySelector('.app').classList.contains('busy'), null, { timeout: 8000 }).catch(() => {});
  await p.waitForFunction(() => !document.querySelector('.app').classList.contains('busy'), null, { timeout: 150000 });
  await p.waitForTimeout(o.after || 1500);
}
// Open the recorded example chat (sidebar "Belmont drapery refit example")
async function example(p) { const el = await p.$('text=Belmont drapery refit'); if (el) { await el.click(); await p.waitForTimeout(1200) } }
// CDP screencast: returns [{t,data(base64 jpeg)}] captured while fn() runs
async function cast(p, fn) {
  const cdp = await p.context().newCDPSession(p); const frames = [];
  cdp.on('Page.screencastFrame', f => { frames.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => { }) });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
  const T0 = Date.now() / 1000; await fn(); await cdp.send('Page.stopScreencast');
  return frames.map(f => ({ t: f.t - T0, d: f.d }));
}
module.exports = { serve, open, brief, example, cast, BRIEF };
