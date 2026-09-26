// Unit screenshots: light, dark and reduced motion for one unit's states, into qa/out/shots/<unit>/.
// NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/shots.js <unit> [page=index.html]
// Each unit lists the states that show it; a state is [name, async p => {...}] run in order on one page.
const H = require('./harness'), path = require('path'), fs = require('fs');
const { wait, click } = require('./states');
// the centre of a node on the Dispatch map, in page coordinates
const hoverNode = async (p, id) => { const pt = await p.evaluate(id => { const m = [...window.__FM].find(m => m.host.id === 'dxMap'); const a = m && m.anchorOf(id); if (!a) return null; const r = m.box.getBoundingClientRect(); return [r.left + a.x + a.w / 2, r.top + a.y + a.h / 2] }, id); if (pt) await p.mouse.move(pt[0], pt[1]); else console.log('no node', id) };
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
  pour: [
    ['opt-mid', async p => { await H.example(p); await p.click('#optBtn'); await wait(p, 70) }],
    ['opt-open', async p => { await wait(p, 500) }],
    ['opt-close-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 120) }],
    ['acct-mid', async p => { await wait(p, 600); await p.click('#me'); await wait(p, 60) }],
    ['acct-open', async p => { await wait(p, 500) }],
    ['settings-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await p.keyboard.press('Control+Comma'); await wait(p, 80) }],
    ['settings-open', async p => { await wait(p, 600) }],
    ['palette-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await p.keyboard.press('Control+KeyK'); await wait(p, 70) }],
    ['palette-open', async p => { await wait(p, 500) }],
    ['sheet-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await click(p, '.run-h'); await click(p, '.run [data-view=map]'); await wait(p, 900); const n = await p.$('.run .mini [data-node="a0"]'); if (n) { await n.focus(); await p.keyboard.press('Enter'); await wait(p, 80) } else console.log('no card map node') }],
    ['sheet-open', async p => { await wait(p, 600) }],
    ['map-fs-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await p.keyboard.press('Alt+KeyL'); await wait(p, 1500); const f = await p.$('#dsp [data-mfs]'); if (f) { await f.click(); await wait(p, 90) } else console.log('no [data-mfs]') }],
    ['map-fs-open', async p => { await wait(p, 600) }],
    ['cite-open', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await p.keyboard.press('Escape'); await wait(p, 500); const c = await p.$('.cite'); if (c) { await c.scrollIntoViewIfNeeded(); await c.hover(); await wait(p, 700) } }],
    ['rest', async p => { await p.mouse.move(1200, 880); await wait(p, 900); const n = await p.evaluate(() => document.querySelectorAll('.pour-plate,.pour-bead').length + [...document.querySelectorAll('.menu,.stg,.pal,.sheet,#cpop,.docv,.mfs')].filter(e => e.style.boxShadow || e.getAnimations().length).length); console.log('leftover pour layers:', n) }],
  ],
  maps: [
    ['field-replay-mid', async p => { await H.example(p); await p.keyboard.press('Alt+KeyL'); await wait(p, 700) }],
    ['field-settled', async p => { await wait(p, 3200); console.log('maps', await p.evaluate(() => [...window.__FM].map(m => `${m.constructor.name} ${m.host.id || m.host.className} W${m.W} H${Math.round(m.Hc)} nodes ${m.visible().length} raf ${!!m.raf}`).join(' | '))) }],
    ['field-hover', async p => { await hoverNode(p, 'a1'); await wait(p, 400) }],
    ['field-lens', async p => { await p.mouse.down(); await p.mouse.up(); await wait(p, 700) }],
    ['flow-replay-mid', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await p.click('#dsp [data-mv=flow]'); await wait(p, 500) }],
    ['flow-settled', async p => { await wait(p, 2600) }],
    ['flow-hover', async p => { await hoverNode(p, 'a2'); await wait(p, 400) }],
    ['card-map', async p => { await p.mouse.move(5, 5); await p.keyboard.press('Alt+KeyL'); await wait(p, 600); await click(p, '.run-h'); await click(p, '.run [data-view=map]'); await wait(p, 1500) }],
    ['fullscreen', async p => { await p.click('#dsp [data-mv=field]').catch(() => {}); await p.keyboard.press('Alt+KeyL'); await wait(p, 900); const f = await p.$('#dsp [data-mfs]'); if (f) await f.click(); await wait(p, 3000) }],
    ['live-early', async p => { await p.keyboard.press('Escape'); await wait(p, 500); await H.brief(p, H.BRIEF, { noWait: true }); await wait(p, 600); await p.keyboard.press('Alt+KeyL'); await wait(p, 3500) }],
    ['live-mid', async p => { await wait(p, 5000); console.log('live', await p.evaluate(() => [...window.__FM].map(m => `${m.constructor.name} live ${m.g && m.g.live} nodes ${m.visible().length} light ${m.lt.id} parts ${(m.P || []).length}`).join(' | '))) }],
    ['live-flow', async p => { await p.click('#dsp [data-mv=flow]'); await wait(p, 3000) }],
    ['live-done', async p => { await p.waitForFunction(() => !document.querySelector('.app').classList.contains('busy'), null, { timeout: 150000 }); await wait(p, 2500) }],
    ['live-field-done', async p => { await p.click('#dsp [data-mv=field]'); await wait(p, 3500); console.log('rest', await p.evaluate(() => [...window.__FM].map(m => `${m.constructor.name} raf ${!!m.raf} light ${m.lt.id}`).join(' | '))) }],
  ],
  dispatch: [
    ['recorded-mid', async p => { await H.example(p); await p.keyboard.press('Alt+KeyL'); await wait(p, 260) }],
    ['recorded', async p => { await wait(p, 1500) }],
    ['recorded-desks', async p => { await p.evaluate(() => { const b = document.querySelector('#dspB'); b.scrollTop = document.querySelector('#dxDesks').offsetTop - 20 }); await wait(p, 900) }],
    ['recorded-end', async p => { await p.evaluate(() => { const b = document.querySelector('#dspB'); b.scrollTop = b.scrollHeight }); await wait(p, 700) }],
    ['notes', async p => { await p.evaluate(() => { const b = document.querySelector('#dspB'); b.scrollTop = document.querySelector('#dxDesks').offsetTop - 20 }); await click(p, '#dk0 [data-notes]'); await wait(p, 500) }],
    ['live-early', async p => { await H.brief(p, H.BRIEF, { noWait: true }); await wait(p, 400); await p.keyboard.press('Alt+KeyL'); await wait(p, 1200) }],
    ['live-desks', async p => { await wait(p, 2600); await p.evaluate(() => { const b = document.querySelector('#dspB'); b.scrollTop = 420 }) ; await wait(p, 300) }],
    ['live-done', async p => { await p.waitForFunction(() => !document.querySelector('.app').classList.contains('busy'), null, { timeout: 150000 }); await wait(p, 1800); await p.evaluate(() => { document.querySelector('#dspB').scrollTop = 0 }); await wait(p, 300); console.log('sections', await p.evaluate(() => [...document.querySelectorAll('#dspB .dsec')].filter(e => !e.hidden).map(e => e.querySelector('h3').textContent).join(' / '))) }],
  ],
  raster: [
    ['recorded', async p => { await H.example(p); await p.keyboard.press('Alt+KeyL'); await wait(p, 900) }],
    ['hover', async p => { const b = await (await p.$('#spec')).boundingBox(); await p.mouse.move(b.x + b.width * .3, b.y + 50); await wait(p, 400) }],
    ['desk-strips', async p => { await p.mouse.move(5, 5); await p.evaluate(() => { const b = document.querySelector('#dspB'); b.scrollTop = document.querySelector('#dxDesks').offsetTop - 20 }); await wait(p, 500) }],
    ['live', async p => { await H.brief(p, H.BRIEF, { noWait: true }); await wait(p, 300); await p.keyboard.press('Alt+KeyL'); await wait(p, 4500); console.log('raster', await p.evaluate(() => { const m = window.__RX().main; return `fpc ${m.fpc} cols ${m.cols} bh ${m.bh} live ${m.live}` })) }],
    ['live-done', async p => { await p.waitForFunction(() => !document.querySelector('.app').classList.contains('busy'), null, { timeout: 150000 }); await wait(p, 2500); console.log('settled', await p.evaluate(() => { const m = window.__RX().main; return `fpc ${m.fpc} cols ${m.cols} live ${m.live} say "${document.querySelector('#specS').textContent}"` })) }],
    ['live-hover', async p => { const b = await (await p.$('#spec')).boundingBox(); await p.mouse.move(b.x + b.width * .6, b.y + 70); await wait(p, 400) }],
  ],
  composer: [
    ['idle', async p => { await click(p, '#newChat'); await p.mouse.move(900, 800); await wait(p, 600) }],
    ['focus', async p => { await p.focus('#prompt'); await wait(p, 500) }],
    ['ready', async p => { await p.keyboard.type('Price forty rooms'); await wait(p, 400) }],
    ['grow-mid', async p => { await p.keyboard.press('Shift+Enter'); await p.keyboard.press('Shift+Enter'); await p.keyboard.press('Shift+Enter'); await wait(p, 120) }],
    ['grown', async p => { await wait(p, 600) }],
    ['sending', async p => { await p.fill('#prompt', H.BRIEF); await p.keyboard.press('Enter'); await wait(p, 140) }],
    ['stop', async p => { await wait(p, 900) }],
    ['steer', async p => { await p.focus('#prompt'); await p.keyboard.type('Also check Cebu'); await wait(p, 700) }],
    ['settled', async p => { await p.fill('#prompt', ''); await p.waitForFunction(() => !document.querySelector('.app').classList.contains('busy'), null, { timeout: 150000 }); await wait(p, 900) }],
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
