// Hover and focus audit: every visible interactive element should change on hover and show a focus state.
// Run with: NODE_PATH=/opt/node22/lib/node_modules node qa/hovers.js [dark]
const H = require('./harness');
const SNAP = el => { const P = ['color', 'background-color', 'border-top-color', 'border-bottom-color', 'opacity', 'box-shadow', 'transform', 'outline-style', 'outline-color', 'text-decoration-line', 'text-decoration-color', 'fill', 'stroke'];
  const all = [el, ...el.querySelectorAll('*')].slice(0, 12); const out = [];
  for (const x of all) for (const ps of [null, '::before', '::after']) { const c = getComputedStyle(x, ps); out.push(P.map(k => c.getPropertyValue(k)).join('|')) } return out.join('#') };
(async () => {
  const srv = await H.serve(), dark = process.argv[2] === 'dark';
  const { b, p, errs } = await H.open(srv.url + '/index.html', { dark });
  const SEL = 'button,a[href],[role=button],[role=menuitem],[role=menuitemradio],[role=tab],[role=option],[role=switch],input,textarea,select,[tabindex="0"]';
  const report = {};
  async function audit(name) {
    const ids = await p.evaluate(S => { let i = 0; return [...document.querySelectorAll(S)].filter(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && c.visibility !== 'hidden' && c.pointerEvents !== 'none' && !e.closest('[aria-hidden=true],[inert]') && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest(S) === e }).map(e => { e.dataset.qa = ++i; return i }) }, SEL);
    const none = [], nofocus = [];
    for (const i of ids) {
      const s = `[data-qa="${i}"]`; const h = await p.$(s); if (!h) continue;
      const label = await h.evaluate(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '')) + ' "' + (e.getAttribute('aria-label') || e.textContent || e.placeholder || '').trim().slice(0, 24) + '"');
      await p.mouse.move(2, 890); await p.waitForTimeout(40); const a = await h.evaluate(SNAP);
      try { await h.hover({ timeout: 800 }) } catch (e) { continue } await p.waitForTimeout(260); const bb = await h.evaluate(SNAP);
      if (a === bb) none.push(label);
      await p.mouse.move(2, 890); await p.keyboard.press('Shift'); await h.evaluate(e => e.focus({ preventScroll: true })); await p.waitForTimeout(260);
      const f = await h.evaluate(SNAP); if (f === a && await h.evaluate(e => document.activeElement === e)) nofocus.push(label);
      await h.evaluate(e => e.blur());
    }
    report[name] = { n: ids.length, noHover: none, noFocus: nofocus };
    if (process.env.LIST) console.log(name, await p.evaluate(() => [...document.querySelectorAll("[data-qa]")].map(e => (e.id || e.className || e.tagName).toString().slice(0, 20)).join(", ")));
    await p.evaluate(() => document.querySelectorAll("[data-qa]").forEach(e => delete e.dataset.qa));
  }
  await audit('start');
  await H.example(p);
  const sc = await p.evaluate(() => { const m = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY) && e.closest('#main')); if (m) m.dataset.qasc = 1; return m ? m.scrollHeight : 0 });
  for (let y = 0, k = 0; y < sc && k < 6; y += 640, k++) { await p.evaluate(y => { const m = document.querySelector('[data-qasc]'); if (m) m.scrollTop = y }, y); await p.waitForTimeout(700); await audit('example@' + y) }
  await p.evaluate(() => { const m = document.querySelector('[data-qasc]'); if (m) m.scrollTop = 0 }); await p.waitForTimeout(300);
  await p.click('.run .rh, .run summary, .run [aria-expanded]').catch(() => {}); await p.waitForTimeout(700); await audit('run open');
  await p.click('#me'); await p.waitForTimeout(500); await audit('account'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  for (const t of ['general', 'appearance', 'map', 'briefs', 'files', 'library', 'kernel', 'about']) {
    await p.evaluate(t => { const b = document.querySelector('#palBtn'); if (!document.querySelector('#setMenu.open')) b.click() }, t); await p.waitForTimeout(500);
    const tab = await p.$(`#setMenu [role=tab][data-tab="${t}"]`); if (!tab) continue; await tab.click(); await p.waitForTimeout(400); await audit('settings:' + t);
  }
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.keyboard.press('Control+k'); await p.waitForTimeout(500); await audit('palette'); await p.keyboard.press('Escape');
  await p.waitForTimeout(400); await p.click('#findBtn'); await p.waitForTimeout(500); await p.keyboard.type('bel'); await p.waitForTimeout(400); await audit('search'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.click('#dspNav'); await p.waitForTimeout(1500); await audit('dispatch');
  for (const [k, v] of Object.entries(report)) { console.log(`\n${k}: ${v.n} controls`); if (v.noHover.length) console.log('  no hover: ' + v.noHover.join(', ')); if (v.noFocus.length) console.log('  no focus: ' + v.noFocus.join(', ')) }
  console.log('\nerrors: ' + errs.length, errs.slice(0, 3)); await b.close(); srv.close();
})();
