// EXPIRA v41 lab · the three pour candidates from research/R1_pour.md §3, each on a real menu card
// with a real shadow, in light and dark. One critically damped spring drives every layer (R1 §3.0).
const $ = (s, r = document) => r.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)');
let SLOW = 1; // lab only: 1 = real speed, 5 = slow motion for inspection
const W_OPEN = 42, W_CLOSE = 26; // rad/s: open settles in ~221ms, close in ~358ms, no overshoot
const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) };
const at = (s, t) => { const A = s.p0 - s.g, B = s.v0 + s.w * A, e = Math.exp(-s.w * t); return { p: s.g + (A + B * t) * e, v: (s.v0 - s.w * B * t) * e } };
const settleTime = s => { let t = 0; while (t < 1.5) { const k = at(s, t); if (Math.abs(k.p - s.g) < 1e-3 && Math.abs(k.v) < .05) break; t += 1 / 240 } return t };

function createPour(layers, { onSettled } = {}) {
  let s = null, t0 = 0, anims = [], rest = 0, slow = 1;
  const run = goal => {
    const now = document.timeline.currentTime;
    let p0 = rest, v0 = 0;
    if (s) ({ p: p0, v: v0 } = at(s, (now - t0) / 1000 / slow)); // carry position and velocity
    anims.forEach(a => a.cancel()); anims = [];
    if (RM.matches) { s = null; rest = goal; onSettled?.(goal); return }
    if (!s) slow = SLOW;
    s = { p0: clamp01(p0), v0, g: goal, w: goal ? W_OPEN : W_CLOSE }; t0 = now;
    const T = settleTime(s), N = Math.max(12, Math.ceil(T * 120));
    const ps = Array.from({ length: N + 1 }, (_, i) => clamp01(at(s, T * i / N).p)); ps[N] = goal;
    anims = layers.map(({ el, frame }) => { const a = el.animate(ps.map(frame), { duration: T * 1000 * slow, easing: 'linear', fill: 'forwards' }); a.startTime = now; return a });
    const mine = s;
    Promise.all(anims.map(a => a.finished)).then(() => { if (s !== mine) return; s = null; rest = goal; anims.forEach(a => a.cancel()); anims = []; onSettled?.(goal) }, () => { });
  };
  return { open: () => run(1), close: () => run(0), get moving() { return !!s }, get isOpen() { return s ? s.g === 1 : rest === 1 } };
}

const MENU = `<div class="pour-content"><div class="mh">Staffing</div>
  <button class="it on">Auto<i>✓</i></button><button class="it">Thorough</button><button class="it">Direct</button>
  <div class="mh">Depth</div><div class="seg"><span class="on">Standard</span><span>Deep</span></div>
  <div class="sep"></div><button class="it">Client-safe<i class="sw on"></i></button><button class="it">Web research<i class="sw"></i></button>
  <p class="hint">The orchestrator decides how many desks, and which, for each brief.</p></div>`;

/* Candidate 1 · surface-tension droplet: transforms and opacity only; nothing clips */
function droplet(root) {
  const BEAD = 18;
  root.innerHTML = `<div class="pour-shadow"></div><div class="pour-shell">${MENU}</div><i class="pour-bead"></i>`;
  const shadow = $('.pour-shadow', root), shell = $('.pour-shell', root), bead = $('.pour-bead', root), content = $('.pour-content', root);
  let g = null;
  const scale = p => `scale(${lerp(g.sx0, 1, p ** .85)},${lerp(g.sy0, 1, p ** 1.15)})`;
  const pour = createPour([
    { el: shell, frame: p => ({ transform: scale(p), opacity: smooth(0, .12, p) }) },
    { el: shadow, frame: p => ({ transform: scale(p), opacity: smooth(.05, .7, p) }) },
    { el: bead, frame: p => ({ transform: `translate(${g.ox}px,${g.oy}px) scale(${lerp(.7, 1.3, smooth(0, .2, p))})`, opacity: smooth(0, .03, p) * (1 - smooth(.08, .2, p)) }) },
    { el: content, frame: p => ({ opacity: smooth(.86, 1, p), filter: `blur(${(4 * (1 - smooth(.86, 1, p))).toFixed(2)}px)` }) }, // Gate A: the content un-blurs as it surfaces
  ], { onSettled: o => root.dataset.state = o ? 'open' : 'closed' });
  return { pour, open(x, y) { root.dataset.state = 'moving'; if (!pour.moving) { const r = root.getBoundingClientRect(); g = { ox: x - r.left, oy: y - r.top, sx0: BEAD / r.width, sy0: BEAD / r.height }; for (const el of [shell, shadow]) el.style.transformOrigin = `${g.ox}px ${g.oy}px` } pour.open() }, close() { root.dataset.state = 'moving'; pour.close() } };
}

/* Candidate 2 · inset bloom: the shell's clip grows from a bead; the shadow plate is an exact affine copy of the clip box */
function inset(root, R = 6) {
  const BEAD = 18;
  root.innerHTML = `<div class="pour-shadow pl"></div><div class="pour-shell">${MENU}</div>`;
  const shadow = $('.pour-shadow', root), shell = $('.pour-shell', root), content = $('.pour-content', root);
  let g = null;
  const box = p => { const ax = p ** .85, ay = p ** 1.15, h = BEAD / 2; return { l: lerp(g.cx - h, 0, ax), r: lerp(g.cx + h, g.W, ax), t: lerp(g.cy - h, 0, ay), b: lerp(g.cy + h, g.H, ay), rad: lerp(h, R, p) } };
  const pour = createPour([
    { el: shell, frame: p => { const b = box(p); return { clipPath: `inset(${b.t}px ${g.W - b.r}px ${g.H - b.b}px ${b.l}px round ${b.rad}px)`, opacity: smooth(0, .1, p) } } },
    { el: shadow, frame: p => { const b = box(p); return { transform: `translate(${b.l}px,${b.t}px) scale(${(b.r - b.l) / g.W},${(b.b - b.t) / g.H})`, opacity: smooth(.05, .7, p) } } },
    { el: content, frame: p => ({ opacity: smooth(.86, 1, p) }) },
  ], { onSettled: o => root.dataset.state = o ? 'open' : 'closed' });
  return { pour, open(x, y) { root.dataset.state = 'moving'; if (!pour.moving) { const r = root.getBoundingClientRect(), h = BEAD / 2, c = (v, m) => Math.min(m - h, Math.max(h, v)); g = { W: r.width, H: r.height, cx: c(x - r.left, r.width), cy: c(y - r.top, r.height) } } pour.open() }, close() { root.dataset.state = 'moving'; pour.close() } };
}

/* Candidate 3 · seven-slice shell: candidate 2's look from translated and scaled slices; no clip, no paint */
function slices(root, R = 6) {
  const BEAD = 12, RMx = Math.max(BEAD / 2, R);
  root.innerHTML = `<div class="pour-shadow pl"></div>${['tl', 'tr', 'bl', 'br'].map(c => `<i class="slice c ${c}"></i>`).join('')}<i class="slice edge top"></i><i class="slice edge bot"></i><i class="slice mid"></i><div class="pour-body">${MENU}</div>`;
  root.style.setProperty('--rm', RMx + 'px');
  const q = c => $('.slice.' + c, root), [tl, tr, bl, br, top, bot, mid] = ['tl', 'tr', 'bl', 'br', 'top', 'bot', 'mid'].map(q);
  const shadow = $('.pour-shadow', root), body = $('.pour-body', root), content = $('.pour-content', root);
  let g = null; const O = .5;
  const box = p => { const ax = p ** .85, ay = p ** 1.15, h = BEAD / 2; return { l: lerp(g.cx - h, 0, ax), r: lerp(g.cx + h, g.W, ax), t: lerp(g.cy - h, 0, ay), b: lerp(g.cy + h, g.H, ay), rad: lerp(h, R, p) } };
  const T = (x, y, sx = 1, sy = sx) => ({ transform: `translate(${x}px,${y}px) scale(${sx},${sy})` });
  const fade = p => smooth(0, .1, p); // the bead fades in and out like A and B, so no dot is left behind at rest
  const piece = (el, f, o = true) => ({ el, frame: p => { const b = box(p), k = f(b, b.rad / RMx, b.r - b.l, b.b - b.t, p); return o && k.opacity === undefined ? { ...k, opacity: fade(p) } : k } });
  const pour = createPour([
    piece(tl, (b, k) => T(b.l, b.t, k)), piece(tr, (b, k) => T(b.r - b.rad, b.t, k)), piece(bl, (b, k) => T(b.l, b.b - b.rad, k)), piece(br, (b, k) => T(b.r - b.rad, b.b - b.rad, k)),
    piece(top, (b, k, w) => T(b.l + b.rad - O, b.t, (w - 2 * b.rad + 2 * O) / g.W, k)), piece(bot, (b, k, w) => T(b.l + b.rad - O, b.b - b.rad, (w - 2 * b.rad + 2 * O) / g.W, k)),
    piece(mid, (b, k, w, h) => T(b.l, b.t + b.rad - O, w / g.W, (h - 2 * b.rad + 2 * O) / g.H)),
    piece(shadow, (b, k, w, h, p) => ({ ...T(b.l, b.t, w / g.W, h / g.H), opacity: smooth(.05, .7, p) })),
    piece(body, (b, k, w, h) => T(b.l, b.t, w / g.W, h / g.H)),
    { el: content, frame: p => ({ opacity: smooth(.86, 1, p) }) },
  ], { onSettled: o => root.dataset.state = o ? 'open' : 'closed' });
  return { pour, open(x, y) { root.dataset.state = 'moving'; if (!pour.moving) { const r = root.getBoundingClientRect(), h = BEAD / 2, c = (v, m) => Math.min(m - h, Math.max(h, v)); g = { W: r.width, H: r.height, cx: c(x - r.left, r.width), cy: c(y - r.top, r.height) } } pour.open() }, close() { root.dataset.state = 'moving'; pour.close() } };
}

const CANDS = [
  ['droplet', 'Surface-tension droplet', 'A bead leaves the button and spreads into the card. Only transform and opacity move, the shadow is its own plate, and nothing is ever clipped. Research score 32/35.', droplet],
  ['inset', 'Inset bloom', 'The card is uncovered by a rounded window that grows from a bead into the card\'s own corners. The shadow plate follows the window exactly. The clip is composited in Chrome but repainted in Safari and Firefox. 30/35.', inset],
  ['slices', 'Seven-slice shell', 'Candidate 2\'s look, built from seven slices that only move and scale, so nothing is clipped or repainted. It costs about three times the GPU memory. 30/35.', slices]];

$('#pourCss').textContent = `
.pgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-4)}
.cand{margin-bottom:var(--sp-8)}
.cand h3{font:400 var(--fs-h3) var(--f-display);color:var(--ink);margin:0 0 var(--sp-1)}
.cand h3 .rn{color:var(--gold-ink);font-style:italic;margin-right:var(--sp-2)}
.cand p{color:var(--soft);max-width:80ch;margin:0 0 var(--sp-3)}
.stage{position:relative;height:420px;border:var(--rule-hair) solid var(--line-2);border-radius:var(--r-5);background:var(--bg);overflow:hidden;cursor:pointer;color:var(--text)}
.stage .cap{position:absolute;left:var(--sp-3);top:var(--sp-2)}
.stage .chip{position:absolute;left:28px;bottom:26px;display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:var(--rule-hair) solid var(--line-3);border-radius:var(--r-2);background:var(--panel);font-size:var(--fs-chrome-2);color:var(--text)}
.stage .hint2{position:absolute;right:var(--sp-3);bottom:var(--sp-2);font:italic 400 var(--fs-ui) var(--f-display);color:var(--mute)}
.pour{position:absolute;left:28px;bottom:64px;width:236px;height:312px;isolation:isolate;cursor:default}
.pour[data-state=closed]{display:none}
.pour-shadow,.pour-shell{position:absolute;inset:0;border-radius:6px}
.pour-shadow{box-shadow:var(--e3)}
.pour-shadow.pl{left:0;top:0;width:100%;height:100%;inset:auto;transform-origin:0 0}
.pour-shell{background:var(--panel);box-shadow:inset 0 0 0 .5px var(--line-3);overflow:clip}
.pour-bead{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--panel);box-shadow:var(--e1);opacity:0}
.slice{position:absolute;left:0;top:0;transform-origin:0 0;background:var(--panel)}
.slice.c{width:var(--rm);height:var(--rm)}.slice.tl{border-top-left-radius:var(--rm)}.slice.tr{border-top-right-radius:var(--rm)}.slice.bl{border-bottom-left-radius:var(--rm)}.slice.br{border-bottom-right-radius:var(--rm)}
.slice.edge{width:100%;height:var(--rm)}.slice.mid{width:100%;height:100%}
.pour-body{position:absolute;inset:0;transform-origin:0 0;border-radius:6px}
.pour[data-state=open] .slice{display:none}
.pour[data-state=open] .pour-body{background:var(--panel);box-shadow:inset 0 0 0 .5px var(--line-3)}
.pour-content{padding:10px 8px;font-size:var(--fs-ui)}
.pour-content .mh{font-size:var(--fs-micro);letter-spacing:var(--tracked);text-transform:uppercase;color:var(--mute);padding:6px 6px 4px}
.pour-content .it{display:flex;align-items:center;width:100%;height:28px;padding:0 6px;border:0;background:none;border-radius:4px;text-align:left;cursor:pointer;transition:background-color var(--t-instant) linear}
.pour-content .it:hover{background:var(--well)}
.pour-content .it i{margin-left:auto;font-style:normal;color:var(--gold-ink)}
.pour-content .sw{width:20px;height:11px;border-radius:6px;background:var(--line-2)}.pour-content .sw.on{background:var(--gold)}
.pour-content .seg{display:grid;grid-template-columns:1fr 1fr;margin:2px 4px 4px;padding:2px;border:var(--rule-hair) solid var(--line-2);border-radius:5px;font-size:var(--fs-chrome-2);text-align:center}
.pour-content .seg span{padding:4px 0;border-radius:3px;color:var(--soft)}.pour-content .seg .on{background:var(--panel);box-shadow:var(--e1);color:var(--ink)}
.pour-content .sep{height:.5px;background:var(--line-2);margin:6px 4px}
.pour-content .hint{font:italic 400 var(--fs-chrome-2)/1.5 var(--f-display);color:var(--mute);margin:6px 6px 0}
.pctl{display:flex;gap:var(--sp-2);align-items:center;margin-bottom:var(--sp-4)}
@media (max-width:820px){.pgrid{grid-template-columns:1fr}}`;

const host = $('#pourHost');
host.innerHTML = `<p class="note">Click anywhere in a stage: the menu pours from the exact point you clicked, and a second click drains it back to that point. Click mid-flight to reverse it; position and speed carry over, so it never jumps. Open settles in about 220 ms and close in about 360 ms, and nothing overshoots. The content arrives only after the shell has formed, and the shadow is never clipped.</p>
<div class="pctl"><button class="btn" id="slowB" aria-pressed="false" type="button">Slow motion ×5</button><button class="btn" id="playAll" type="button">Play all</button></div>
${CANDS.map(([k, name, desc], i) => `<div class="cand" id="c-${k}"><h3><span class="rn">${['A', 'B', 'C'][i]}.</span>${name}</h3><p>${desc}</p><div class="pgrid">${['light', 'dark'].map(th => `<div class="stage th th-${th}" data-k="${k}" data-th2="${th}"><span class="cap">${th}</span><span class="chip">Auto ⌃</span><span class="hint2">click anywhere</span><div class="pour" data-state="closed"></div></div>`).join('')}</div></div>`).join('')}`;
const CTL = new Map();
host.querySelectorAll('.stage').forEach(st => { const f = CANDS.find(c => c[0] === st.dataset.k)[3]; CTL.set(st, f($('.pour', st))) });
host.addEventListener('click', e => {
  const st = e.target.closest('.stage'); if (!st || e.target.closest('.pour-content')) return;
  const c = CTL.get(st); c.pour.isOpen ? c.close() : c.open(e.clientX, e.clientY);
});
$('#slowB').onclick = e => { SLOW = SLOW === 1 ? 5 : 1; e.currentTarget.setAttribute('aria-pressed', SLOW > 1) };
const chipPt = st => { const r = $('.chip', st).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] };
$('#playAll').onclick = () => CTL.forEach((c, st) => c.pour.isOpen ? c.close() : c.open(...chipPt(st)));
// test hooks for qa/lab/cast.js
window.__pour = { CTL, chipPt, setSlow: v => SLOW = v };
