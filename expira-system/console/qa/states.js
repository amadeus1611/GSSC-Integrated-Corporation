// The UI states the style and co-match checks walk through, in order, on one page.
const H = require('./harness');
const wait = (p, ms = 900) => p.waitForTimeout(ms);
// wait until the page stops changing size (async panels such as the kernel tab)
const stable = async p => { let last = ''; for (let i = 0; i < 20; i++) { const h = await p.evaluate(() => [...document.querySelectorAll('#stgP,#thread,#dspB')].map(e => e.scrollHeight).join()); if (h === last) return; last = h; await wait(p, 400) } };
const click = async (p, sel) => { const e = await p.$(sel); if (e) { await e.click().catch(() => {}); await wait(p) } return !!e };
const STATES = [
  ['start', async p => { await click(p, '#newChat') }],
  ['example', async p => { await H.example(p) }],
  ['run-open', async p => { await click(p, '.run-h') }],
  ['dispatch', async p => { await p.keyboard.press('Alt+KeyL'); await wait(p, 1500) }],
  ['esc', async p => { await p.keyboard.press('Escape'); await wait(p) }],
  ['optmenu', async p => { await click(p, '#optBtn') || await click(p, '[aria-controls=optMenu]') }],
  ['esc2', async p => { await p.keyboard.press('Escape'); await wait(p) }],
  ['acct', async p => { await click(p, '#me') }],
  ['settings', async p => { await p.keyboard.press('Escape'); await p.keyboard.press('Control+Comma'); await wait(p) }],
  ...['appearance', 'briefs', 'map', 'kernel', 'files', 'library', 'about'].map(t => ['tab-' + t, async p => { await click(p, `[data-tab=${t}]`) }]),
  ['palette', async p => { await p.keyboard.press('Escape'); await wait(p, 400); await p.keyboard.press('Control+KeyK'); await wait(p) }],
  ['folded', async p => { await p.keyboard.press('Escape'); await wait(p, 400); await click(p, '#fold') }],
  ['unfolded', async p => { await click(p, '#fold') }],
  ['mockrun', async p => { await H.brief(p) }],
];
module.exports = { wait, stable, click, STATES };
