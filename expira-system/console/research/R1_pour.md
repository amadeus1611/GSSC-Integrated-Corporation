# R1: a new pour (liquid reveal for menus, popovers, sheets and cards)

Research for EXPIRA Console v41, Phase 1 (REBUILD_PLAN §4). Written by the research-high agent on 2026-09-25.
Constraints are from DESIGN_ENGINE §3 and REBUILD_PLAN §2: calm, premium and liquid; no bounce or overshoot; fast entry (180–240ms); soft close (300–380ms) back to the click point; transform and opacity wherever possible; never clip a shadow; content only after the shell has formed; interruptible with velocity carried; light and dark themes; reduced motion means a state change only.

**Tools.** Web research used Exa (`web_search_exa`, `web_fetch_exa`), as instructed. There was one supplement, not a fallback: Exa's fetch of Chromium's `runtime_enabled_features.json5` returned only the file header, so I fetched the raw file from the GitHub mirror with `curl` and queried the chromestatus.com API with `curl` to check a shipping status. WebSearch and WebFetch were not needed.

**Verification labels.**
- **V (verified):** I read the page, or the relevant passage of it, and it states the claim directly.
- **U (unverified):** the claim comes from a search snippet or a community answer, is dated, is inferred from code rather than stated, or comes from my own knowledge. Every U claim that matters is marked U where it is used.
- **Mine:** my own reasoning or my own local measurement. For example, I checked the spring maths numerically with Node on 2026-09-25; the numbers are in §3.0.

---

## 0. Summary

1. **Replace the pour's architecture before its look.** The v27 to v39 pour broke because clip, tint, squeeze and meniscus ran on separate timelines and fought each other. Every candidate below is driven by **one critically damped progress value `p` in [0,1]**. Each layer (shell, shadow, bead, content, and an optional gold rim) is a **pure function of `p`**, baked into Web Animations API keyframes that all share one start time. Layers cannot drift apart. Interruption re-bakes every layer from the live `(p, velocity)`, so nothing jumps.
2. **Ranking (weighted score out of 35; style counts double):**
   1. **Surface-tension droplet** (bead plus a transform-only shell and a shadow plate), 32. Best all-round: compositor-only in every engine, and the shadow is never clipped because nothing is clipped.
   2. **Inset bloom** (`clip-path: inset(… round r)` from a bead to the card, with a sibling shadow plate), 30. The purest bead-to-card shape. Chromium now composites clip-path animations: the flag is `stable` on Chromium main as of today (**V**), but the milestone it shipped in is **U**. Safari and Firefox paint the clip each frame.
   3. **Seven-slice shell** (the same look as #2, built from transform-only slices), 30. Compositor-only everywhere, but it has the most moving parts and needs an opaque surface.
3. **Next in line:** FLIP scale with counter-scaled content (27) and CSS transitions with `@starting-style` (25).
4. **The owner's four ideas:** the droplet ranks first. The other three fall below the top three:
   - the ink spread (24): the WebGL version is the most liquid, but also the most fragile;
   - the feathered, noise-edged `mask-image` bloom (23): it paints every frame, it needs a separate shadow shape, and its noise edge doesn't work in Safari;
   - the metaball handoff (18): a heavy filter plus a two-system seam.

   View Transitions (19) are rejected because they cannot be interrupted.
5. **Useful facts for the tokens:**
   - A critically damped spring released from rest has the **same normalised curve at every stiffness**. One `linear()` string therefore serves both entry and exit at different durations (§3.0).
   - A static `linear()` easing cannot carry velocity through an interruption (**V**, S24). The runtime therefore bakes keyframes per interruption instead.
   - In Safari, a `playbackRate` other than 1 drops hardware acceleration (**V**, S4). Never implement reversal with `reverse()` or `updatePlaybackRate(-1)`.

---

## 1. Survey of techniques

Sources are listed in §5 with their URLs, dates and labels. Each technique notes which non-compositor property it needs and what that costs.

**T1. Mask-image radial bloom (`@property`-animated mask gradient, feathered or noise-edged front)**
- **How it works:** a `radial-gradient` mask centred on the click point. The radius and feather width are registered custom properties (`@property`), so they can be transitioned or animated (S11, S12; **V**). A noise edge needs either a static noise texture composited into the mask, which gives a grainy, dithered edge rather than a crisp organic contour, or an SVG `<mask>` with `feTurbulence` and a threshold.
- **Cost:** the mask repaints every frame. Animating `mask-position` in Chrome drove the element's paint count past 1,000 in a few seconds, and the same animation was janky in Firefox (S13, **V**). Motion's tier list puts `mask-image` gradients and CSS variables in **C-tier (paint)**. An *inherited* custom property animated per frame can force style recalculation across the whole subtree (the "inheritance bomb"), so use `inherits: false` (S4, **V**).
- **Shadow:** the mask clips the element's own box-shadow, so the shadow needs a second layer shaped like a circle intersected with a rectangle. A transform cannot match that shape, so it has to be a `drop-shadow` filter on a wrapper (re-filtered every frame) or an approximation.
- **Support:** `@property` is in Chrome 85, Safari 16.4 and Firefox 128 (2024-07-09) (S26, **V**). Safari does not apply `mask-image: url(#svgMask)` to HTML elements (S20, **V**), so the crisp noise edge is Chromium and Firefox only.

**T2. Surface-tension droplet (bead, then a transform-only shell, with the shadow on its own plate)**
- **How it works:** a small bead (a circle about 18px across) appears at the click point, and the card's shell spreads out of it using `transform: scale(sx, sy)` with `transform-origin` at the click point. The x axis leads and the y axis follows slightly, so the shape reads as non-rigid. The shadow sits on its own plate, which scales in step and fades in with `p`.
- **Cost:** transform and opacity only, so S-tier (compositor) in Chromium, Firefox and Safari (S4, **V**).
- **Known costs of scaling:** scale distorts `border-radius` and `box-shadow` (S5, **V**). With micro radii (3–8px) the apparent radius is `r × s` while small, so corners look sharper during growth. The bead covers the smallest phase.
- **Rules it follows:** it never scales from 0; it starts at about 18px, in line with "nothing appears from nothing" (S28, **V**). It is also origin-aware (S28).

**T3. SVG metaball ("gooey") bead that hands off to the real card**
- **How it works:** `feGaussianBlur` followed by an alpha threshold in `feColorMatrix` (for example `0 0 0 18 -7`) on a *container* of circles, which fuse where their blurred fields overlap (S14, S15, S16; **V**).
- **Limitations:** it blurs content, so text must sit above it and cross-fade in afterwards. The container needs bleed space, or edges clip. It is "resource intensive if applied to large areas" (S14, S15; **V**). The filter region re-rasterises whenever a child moves (S16, **V**).
- **The handoff:** the goo proxy has to be swapped for the real card, which is exactly the kind of two-system seam that broke the old pour.

**T4. Ink-in-water spread along a flow-field edge**
- **Option (a), SVG:** `feTurbulence` plus `feDisplacementMap` on the surface, or on its mask. Animating `baseFrequency` regenerates the noise every frame, "the expensive path", and filter regions re-rasterise every frame (S17, **V**).
- **SVG pitfalls:**
  - WebKit fails on `feImage` in filters applied to HTML (S18, **V**, 2021).
  - Transformed turbulence loses tile stitching in Safari (S19, **U**).
  - Always set `color-interpolation-filters="sRGB"` (S19, **U**).
- **Option (b), WebGL:** a signed-distance rounded rectangle plus fbm (fractal) noise displacement in a fragment shader, which the Codrops tutorials use (S21, **V**). The GPU work is cheap, but it runs from `requestAnimationFrame` on the main thread (A-tier, S4 **V**). It also needs a WebGL context in a single-file artifact, device-pixel-ratio handling, theme colours passed to the shader, and a canvas-to-DOM handoff because text cannot live in the canvas.

**T5. FLIP scale-from-origin with counter-scaled content**
- **How it works:** scale the container and apply an inverse scale to its children. The counter-scale is not linear in time, so it has to be baked per frame into keyframes. Baked keyframes run on the compositor even while the main thread is busy (S1, **V**; S2, **V**).
- **Documented problems:**
  - Blurry text on low-DPI screens from rounding in scale × counter-scale (S1, **V**).
  - Counter-scaling does not fix `border-radius` (S31, **V**).
  - Reversing the entry animation makes an ease-out feel like a sluggish ease-in, so the collapse needs its own curve (S1, **V**).
- **Relation to T2:** T2 is T5 with a bead in front and with content that fades in late, so it needs no counter-scale.

**T6. Clip-path bloom (`inset(… round r)` or `circle()`) with a sibling shadow plate**
- **How it works:** a single clip whose rounded rectangle goes from a bead (radius = half the bead size) to the card (radius = card radius). The canon asks that "corner radii … settle into the card's own radius", and this does it in one property.
- **Chromium:** composited clip-path animation is implemented as a native paint worklet (S7, **V**). The `CompositeClipPathAnimation` runtime flag reads `status: "stable"` on Chromium main as fetched on 2026-09-25 (S6, **V**). A 2026-07-14 post by Alex Russell said it was "about to be GPU accelerated" (S8, **U** for the milestone).
- **Main-thread fallbacks in Chromium:**
  - keyframes with incompatible shape types (S7, **V**);
  - fragmented layout (S7, **V**);
  - global values such as `inherit` (S7, **V**);
  - reportedly, an animation delay (S8, **U**).
- **Safari and Firefox:** clip-path animations are paint-driven. A 2016–18 Chromium thread said Safari handled them "much better" than Chrome (S10; **U** for today).
- **Shadow:** the clip cuts the shell's own shadow, which is why v39 needed its negative inset. The fix is a sibling shadow plate.

**T7. Seven-slice (nine-slice) transform shell**
- **How it works:** four corner pieces that translate (and scale only if the radius changes), top and bottom strips that scale along x, and a middle band that scales along x and y. The result is a rounded rectangle whose corners never distort, using only transforms (S29, **V**, community).
- **Requirements:** the surface colour must be opaque, because slices overlap by half a pixel to hide anti-aliasing seams. It also has more layers (about 9).

**T8. View Transitions API (document-scoped or element-scoped)**
- **How it works:** a circle reveal from the click point by clipping `::view-transition-new` with WAAPI (S22, **V**).
- **Interruption:** the transition cannot be interrupted from its current state. You wait for it to finish or skip it (S4, **V**). Starting another transition on the same scope skips the running one (S22, **V**).
- **Other limits:** by default the group animates `width` and `height` (layout) (S4, **V**; S31). Element-scoped transitions are **Chrome 147+ only**; Firefox and Safari have none (S22, **V**).

**T9. CSS transitions with `@starting-style`, `allow-discrete` and a `linear()` spring**
- **How it works:** the simplest option. A CSS transition retargets from its current value when interrupted, so there is no position jump, but it carries no velocity. `linear()` has been Widely available since 2026-06-11 (Chrome 113, Firefox 112, Safari 17.2) (S25, **V**).
- **Problems for this job:**
  - A static `linear()` has no velocity continuity (S24, **V**).
  - `overlay` is Chromium only (S27, **V**).
  - Firefox's popover *exit* transition via `display … allow-discrete` did not animate (S27, Bugzilla 1912426; status NEW when I read it; **U** for the current Firefox).
  - It can't express non-linear per-layer mappings such as the bead or the content gate.

**Timing layer (applies to every technique): `linear()` springs versus baked WAAPI springs**
- `linear()` is a precomputed snapshot of the curve. It is fine from rest to rest, but "interrupting one restarts it from a standstill" (S24, **V**, tw-spring and Carmen Ansio).
- The fix that tw-spring documents: on interruption, read the analytic `(x, v)` of the spring and re-bake a new compositor animation (S24, **V**, per the project's own claims).
- Do not reverse by setting `playbackRate`:
  - Safari's Core Animation path is not accelerated at `playbackRate ≠ 1` (S4, **V**).
  - `reverse()` replays the same curve mirrored (S1, S23; **V**).
  - Setting `playbackRate` directly on a compositor-run animation can jump; `updatePlaybackRate()` exists for that reason (S23, **V**).

---

## 2. Scored ranking

Scores run from 1 (poor) to 5 (best).
- **Fit:** calm, premium and liquid, with no bounce.
- **Cost:** GPU and main-thread load at 60fps on a mid laptop.
- **Shadow:** how safe the shadow is.
- **Interrupt:** whether the animation can reverse mid-way while carrying velocity.
- **Robust:** 5 means simple, with few layers that could fight.
- **Browsers:** Chromium first, then Safari and Firefox.
- **Weighted** = 2 × Fit + Cost + Shadow + Interrupt + Robust + Browsers (maximum 35).

| Rank | Technique | Fit | Cost | Shadow | Interrupt | Robust | Browsers | Sum | **Weighted** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | T2 Surface-tension droplet | 4 | 5 | 5 | 5 | 4 | 5 | 28 | **32** |
| 2 | T6 Inset bloom (clip-path) + shadow plate | 5 | 4 | 4 | 5 | 4 | 3 | 25 | **30** |
| 3 | T7 Seven-slice transform shell | 5 | 5 | 4 | 5 | 2 | 4 | 25 | **30** |
| 4 | T5 FLIP scale with counter-scaled content | 3 | 5 | 5 | 4 | 3 | 4 | 24 | **27** |
| 5 | T9 CSS transitions + `@starting-style` + `linear()` | 2 | 5 | 5 | 3 | 5 | 3 | 23 | **25** |
| 6 | T4 Ink / flow-field (WebGL variant) | 4 | 3 | 4 | 4 | 1 | 4 | 20 | **24** |
| 7 | T1 Mask-image radial bloom (feathered, noise edge) | 4 | 2 | 3 | 4 | 3 | 3 | 19 | **23** |
| 8 | T8 View Transitions | 3 | 4 | 3 | 1 | 3 | 2 | 16 | **19** |
| 9 | T3 SVG metaball bead handoff | 3 | 2 | 3 | 2 | 2 | 3 | 15 | **18** |

**Ties.** #2 and #3 tie on 30. #2 ranks higher because it is more robust: the old pour failed on complexity, not on cost.

**Why each score** (brief; the numbers are judgement calls grounded in the cited sources):

- **T2 droplet.**
  - Fit 4: the spread from the click point reads as liquid, and the elliptical corners during anisotropic growth add softness. It loses a point because mid-growth corners look sharper (radius × scale) than a true bead-to-card morph.
  - Cost 5: transform and opacity only, so zero paint after the first raster.
  - Shadow 5: nothing is clipped. The shadow is a sibling plate with the same transform and its own opacity, so a small bead casts a small, tight shadow.
  - Interrupt 5: see §3.0.
  - Robust 4: four layers, all functions of `p`.
  - Browsers 5: transform and opacity at `playbackRate` 1 are accelerated in every engine (S4).
- **T6 inset bloom.**
  - Fit 5: exact bead-to-card morph, with the radius settling on the spring.
  - Cost 4: Chromium's composited path (S6/S7) still rasterises a mask each frame on the compositor, and other engines paint per frame. That is cheap for 200–400px surfaces but costly for the fullscreen map.
  - Shadow 4: the plate is an exact affine copy of the clip box, but its radius differs slightly (invisible under the blur).
  - Browsers 3: the Chromium milestone is **U**, and Safari and Firefox run on the main thread.
- **T7 seven-slice.**
  - Fit 5: the same look as T6.
  - Cost 5: transforms only. It uses about 3× the surface area in GPU memory, which is fine for menus and not for fullscreen.
  - Robust 2: 7 slices plus a plate plus a body, an opaque surface is mandatory, seams are a risk, and the rig has to be swapped for a static card at rest.
  - Browsers 4: seam anti-aliasing varies by engine (**U** until tested in the lab).
- **T5 FLIP.** Fit 3, because it reads as a scale rather than a pour. Robust 3, because of the counter-scale sampling error and blurry text (S1).
- **T9 CSS transitions.** Fit 2, because it gives the generic scale-and-fade. Interrupt 3: no jump, but velocity is lost. Browsers 3: `overlay` is Chromium only, and Firefox had the exit bug.
- **T4 WebGL ink.** Fit 4: the most liquid of all, but at risk of reading as an effect rather than calm. Robust 1, because of the canvas-to-DOM handoff, the context, DPR and theme uniforms.
- **T1 mask bloom.** Cost 2: paint every frame, and main-thread style work (S4, S13). Shadow 3: it needs a non-affine shadow shape. Browsers 3: the SVG noise mask doesn't work in Safari (S20).
- **T8 View Transitions.** Interrupt 1 (S4). Browsers 2: element scoping is Chrome 147+ only (S22).
- **T3 metaball.** Cost 2 and Robust 2: a filter over the whole region re-rasterised per frame (S14–S16), plus a two-system handoff.

---

## 3. Top three, specified for the lab page

### 3.0 Shared core: one spring, one progress, baked keyframes

**Spring.** Critically damped (damping ratio 1), in closed form. With `A = p0 − g` and `B = v0 + ωA`:
- `p(t) = g + (A + Bt)·e^(−ωt)`
- `v(t) = (v0 − ωBt)·e^(−ωt)`

**Tokens** (my Node measurements, 2026-09-25):

| Token | ω | 85% | 99% | Settle (99.9%) |
|---|---|---|---|---|
| Open | 42 rad/s | 81ms | 159ms | **221ms** (inside `--t-enter`, 180–240ms) |
| Close | 26 rad/s | reaches p = 0.85 at 27ms | | **358ms** (inside `--t-exit`, 300–380ms) |

**No overshoot.** From rest the spring cannot overshoot. I also scanned interruptions every 5ms across 0–400ms, open→close and close→open: worst overshoot = 0.

**No jump at the seam.** Interrupting an open at 60ms: p = 0.7168 and v = 8.52/s at the seam. The close then carries the forward motion to a peak of 0.763 before draining, with no jump and no overshoot below 0. In a mock of the baked keyframes, the old and new animations differ by 0.0016 in `p` at the seam; that is the linear-sampling error at about 120 samples per second.

**One curve for both durations.** A critically damped spring from rest is self-similar in `ωt`, so entry and exit share **one** `linear()` string and differ only in duration. This fits `--spring-chrome` for rest-to-rest CSS use elsewhere:

```css
--spring-chrome: linear(0, 0.08, 0.238, 0.406, 0.554, 0.674, 0.766, 0.835, 0.885, 0.921, 0.946,
  0.963, 0.975, 0.983, 0.989, 0.992, 0.995, 0.997, 0.998, 0.999, 1);  /* 221ms open, 358ms close */
```

**Baking.**
1. On every open, close or interruption, sample `p(t)` at about 120 samples per second until it settles.
2. Map each sample through each layer's `frame(p)` to get keyframes, and use `easing: 'linear'` between them.
3. Start every layer's animation with the same `startTime`, so they share one clock.

This is the Paul Lewis baked-keyframe technique (S1) with a spring in place of a cubic-bezier. The result is S-tier for transform and opacity layers.

**On interruption:**
1. Read the analytic `(p, v)` at `document.timeline.currentTime`.
2. `cancel()` the running animations.
3. Re-bake from `(p, v)` toward the new goal, in the same task, so no frame is ever unstyled.

The seam error is at most about one frame of travel, because the compositor can run a frame ahead of the main thread (S24 reports the same bound; **V** per the project).

**At rest.** When settled, cancel the animations; `frame(1)` equals the resting open CSS and `frame(0)` the closed CSS, so cancelling never jumps. This releases the layers (stillness when settled) and leaves no `fill: forwards` residue behind.

**Reduced motion.** No animation at all. Set the end state and fire `onSettled` immediately (canon: state changes only).

**Themes.** Keyframes contain **no colours**, only transforms, opacities and clip geometry. Surfaces, hairlines, shadows and the gold all come from CSS tokens defined separately for light and dark. That makes theme switching mid-animation safe and stops the v39 tint layer from coming back. If Duke wants the gold meniscus, it goes in as one more layer: an absolutely positioned 1px inset gold ring inside the shell, with `opacity = smooth(.2,.45,p)·(1−smooth(.75,.95,p))`. As a pure function of `p`, it cannot fight the others.

**Geometry.** Before the first frame of an open *from rest*, read `getBoundingClientRect()` once; never read layout during the animation (DESIGN_ENGINE §4). The click point is stored with the open, and the close drains back to that same stored point even when the close is triggered by Esc or an outside click (canon: "drains back to the same point"). If an open interrupts a close mid-flight, the origin is not re-measured.

```js
// pour-core.js: one critically damped progress p in [0,1] drives every layer.
// Every layer is a pure function of p, so layers cannot drift or fight (the v27 to v39 failure).
export const W_OPEN = 42, W_CLOSE = 26; // rad/s: open settles in 221ms, close in 358ms (99.9%)
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const at = (s, t) => { // closed form: x(t) = g + (A + B t) e^(-w t), with no overshoot from rest
  const A = s.p0 - s.g, B = s.v0 + s.w * A, e = Math.exp(-s.w * t);
  return { p: s.g + (A + B * t) * e, v: (s.v0 - s.w * B * t) * e };
};
const settleTime = s => {
  let t = 0;
  while (t < 1.5) { const k = at(s, t); if (Math.abs(k.p - s.g) < 1e-3 && Math.abs(k.v) < 0.05) break; t += 1 / 240; }
  return t;
};
const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// layers: [{ el, frame: p => Keyframe }]. frame(1) must look identical to the element's resting
// open CSS (and frame(0) to its closed CSS), so cancelling a finished animation never jumps.
export function createPour(layers, { onSettled } = {}) {
  let s = null, t0 = 0, anims = [], rest = 0; // rest = settled p: 0 closed, 1 open
  const run = goal => {
    const now = document.timeline.currentTime;
    let p0 = rest, v0 = 0;
    if (s) ({ p: p0, v: v0 } = at(s, (now - t0) / 1000)); // carry position AND velocity
    anims.forEach(a => a.cancel()); anims = [];
    if (RM.matches) { s = null; rest = goal; onSettled?.(goal); return; } // state change only
    s = { p0: clamp01(p0), v0, g: goal, w: goal ? W_OPEN : W_CLOSE }; t0 = now;
    const T = settleTime(s), N = Math.max(12, Math.ceil(T * 120)); // about 120 samples a second
    const ps = Array.from({ length: N + 1 }, (_, i) => clamp01(at(s, (T * i) / N).p));
    ps[N] = goal;
    anims = layers.map(({ el, frame }) => {
      const a = el.animate(ps.map(frame), { duration: T * 1000, easing: 'linear', fill: 'forwards' });
      a.startTime = now; // lock every layer to one clock
      return a;
    });
    const mine = s;
    Promise.all(anims.map(a => a.finished)).then(() => {
      if (s !== mine) return; // superseded by an interruption
      s = null; rest = goal;
      anims.forEach(a => a.cancel()); anims = []; // release layers: stillness when settled
      onSettled?.(goal);
    }, () => {});
  };
  return {
    open: () => run(1),
    close: () => run(0),
    toggle: () => run(s ? 1 - s.g : 1 - rest),
    get moving() { return !!s; },
  };
}
```

### 3.1 Candidate 1: surface-tension droplet (transform-only)

**Layer structure** (DOM only):

```
.pour (position:fixed, final rect)
  .pour-shadow   box-shadow plate, same box and radius as the shell
  .pour-shell    background, hairline, overflow:clip
    .pour-content
  .pour-bead     18px circle, same surface colour, tiny shadow
```

**What animates:**
- **Shell and shadow:** `transform: scale(sx, sy)` about `transform-origin` = the click point, with `sx = lerp(18/W, 1, p^0.85)` and `sy = lerp(18/H, 1, p^1.15)`, so x leads and y follows.
- **Shell opacity:** `smooth(0,.12,p)`.
- **Shadow opacity:** `smooth(.05,.7,p)`.
- **Bead:** `translate` to the origin, scale 0.7→1.3, and opacity that is visible only for `p` below about 0.2.
- **Content:** `opacity: smooth(.86,1,p)`.
- **Never animated:** clip-path, mask, filter and custom properties.

**How the shadow stays intact:** nothing in the stack clips. The shadow plate is a sibling, so the shell's `overflow:clip` does not reach it; it takes the same scale and origin as the shell, so the shadow "moves with the shape". Its blur shrinks with the scale, which reads as a bead sitting on the surface.

**Close back to the click point:** the stored `transform-origin` is the fixed point of the scale, so the shell converges on it. At the end the bead resurfaces briefly and fades, the "pool" left by the drain.

**Order.** On open, content passes 50% opacity at about p = 0.93, roughly 105ms in, when the shell is already at 92–94% of its final width and height. On close, content fades first (gone by about 27ms) and then the shell drains.

**Reversal mid-way:** see §3.0.

**Reduced motion:** state change only.

**GPU and paint cost** (mid laptop, **estimates, Mine**):
- **Layers:** about 3–4 composited layers of the surface size. A 320×400 menu at DPR 2 is about 2MB of GPU memory per layer, so about 5MB total.
- **Per open:** one raster, and baking under 0.3ms.
- **Per frame:** zero paint and zero layout, compositor only.
- **Fullscreen map at DPR 2:** about 33MB per layer. Skip the shadow plate there; a full-bleed surface doesn't need one.

**Risks to check in the lab:**
- Content squish while fading in: scale is at least 0.92 once content is more than 50% visible.
- Corner sharpness mid-growth.
- If the squish shows, apply Lewis-style counter-scale (S1) to `.pour-content` only.

```js
/* CSS
.pour{position:fixed;isolation:isolate}               left/top/width/height = the final rect
.pour[data-state=closed]{display:none}
.pour-shadow,.pour-shell{position:absolute;inset:0;border-radius:var(--r-card)}
.pour-shadow{box-shadow:var(--elev-2)}                own layer, never clipped by anything
.pour-shell{background:var(--surface-raised);border:1px solid var(--hairline);overflow:clip}
.pour-bead{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;
  border-radius:50%;background:var(--surface-raised);box-shadow:var(--elev-bead);opacity:0}
.pour-content{opacity:1}                               lives inside .pour-shell
*/
import { createPour, smooth, lerp } from './pour-core.js';
const BEAD = 18;

export function dropletPour(root) {
  const q = s => root.querySelector(s);
  const shadow = q('.pour-shadow'), shell = q('.pour-shell'), bead = q('.pour-bead'), content = q('.pour-content');
  let g = null; // geometry, captured once per open

  const scale = p => { // anisotropic spread: x leads, y follows; scale(1,1) at p = 1
    const sx = lerp(g.sx0, 1, p ** 0.85), sy = lerp(g.sy0, 1, p ** 1.15);
    return `scale(${sx},${sy})`;
  };
  const layers = [
    { el: shell,   frame: p => ({ transform: scale(p), opacity: smooth(0, 0.12, p) }) },
    { el: shadow,  frame: p => ({ transform: scale(p), opacity: smooth(0.05, 0.7, p) }) },
    { el: bead,    frame: p => ({
        transform: `translate(${g.ox}px,${g.oy}px) scale(${lerp(0.7, 1.3, smooth(0, 0.2, p))})`,
        opacity: smooth(0, 0.03, p) * (1 - smooth(0.08, 0.2, p)) }) },
    { el: content, frame: p => ({ opacity: smooth(0.86, 1, p) }) }, // after the shell has formed
  ];
  const pour = createPour(layers, {
    onSettled: open => { root.dataset.state = open ? 'open' : 'closed'; },
  });

  return {
    open(x, y) { // click point in viewport px
      root.dataset.state = 'moving'; // display on, final rect laid out
      if (!pour.moving) { // measure only from rest; mid-flight keep the original origin
        const r = root.getBoundingClientRect(); // the one layout read, before any frame
        g = { ox: x - r.left, oy: y - r.top, sx0: BEAD / r.width, sy0: BEAD / r.height };
        for (const el of [shell, shadow]) el.style.transformOrigin = `${g.ox}px ${g.oy}px`;
      }
      pour.open();
    },
    close() { root.dataset.state = 'moving'; pour.close(); }, // drains back to g.ox/g.oy, the point it was poured from
  };
}
```

### 3.2 Candidate 2: inset bloom (clip-path morph, bead to card)

**Layer structure** (DOM only):

```
.pour
  .pour-shadow   plate, transform-origin 0 0, sibling of the shell
  .pour-shell    background, radius, clip-path animated
    .pour-content
```

**What animates:**
- **Shell:** `clip-path: inset(t r b l round rad)`. The box grows from an 18px bead centred on the clamped origin to the full rect, with x leading and y following, and `rad` goes from 9px (a circle) to the card radius (for example 6px). Every keyframe has **the same shape type** and no delay is used, which avoids Chromium's main-thread fallbacks (S7, S8). The shell's opacity is `smooth(0,.1,p)`.
- **Shadow plate:** `transform: translate(l,t) scale(w/W, h/H)` about `0 0`, an **exact affine copy of the clip box**, plus opacity.
- **Content:** opacity only. It is not scaled, only clipped, so there is no squish at all.
- **Non-compositor property:** clip-path. In Chromium it is composited through a native paint worklet: the mask is re-rasterised each frame off the main thread, per the flag and commits. Elsewhere it is main-thread paint of the element each frame, which is cheap at menu size (**U** for an exact figure; measure it in the lab with Paint Flashing and a trace).

**How the shadow stays intact:** the clip is on `.pour-shell` only, never on the plate. The plate follows the clip rectangle exactly because the clip is always an axis-aligned rectangle, and an axis-aligned rectangle is an affine image of the full box. At rest the clip is `none`, and `inset(0 round R)` at p = 1 is visually identical to the element's own `border-radius: R`.

**Close back to the click point:** the box converges on the stored origin. Because a clip cannot paint outside the element's box, the origin is **clamped inside the rect** (inset by the bead radius). For a menu below its button, the bead therefore forms on the menu edge nearest the trigger, which reads as poured out of the button.

**Reversal mid-way:** see §3.0. Clip keyframes are re-baked like any other layer.

**Reduced motion:** state change only; `clip-path` stays `none`.

**GPU and paint cost** (**Mine**, estimates):
- **Layers:** 2 layers plus the shell.
- **Chromium:** per-frame mask raster on the compositor.
- **Safari and Firefox:** per-frame paint of the shell. Avoid for the fullscreen map (per-frame paint at DPR 2 over the whole viewport); use Candidate 1 there.

```js
/* CSS
.pour{position:fixed;isolation:isolate}
.pour[data-state=closed]{display:none}
.pour-shadow{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;
  border-radius:var(--r-card);box-shadow:var(--elev-2)}   sibling of the shell: never clipped
.pour-shell{position:absolute;inset:0;border-radius:var(--r-card);background:var(--surface-raised);
  clip-path:none}                                         resting state = no clip at all
*/
import { createPour, smooth, lerp } from './pour-core.js';
const BEAD = 18;

export function insetPour(root, R = 6) {
  const q = s => root.querySelector(s);
  const shadow = q('.pour-shadow'), shell = q('.pour-shell'), content = q('.pour-content');
  let g = null;

  const box = p => { // bead box around the origin -> full box; x leads, y follows
    const ax = p ** 0.85, ay = p ** 1.15, h = BEAD / 2;
    return { l: lerp(g.cx - h, 0, ax), r: lerp(g.cx + h, g.W, ax),
             t: lerp(g.cy - h, 0, ay), b: lerp(g.cy + h, g.H, ay), rad: lerp(h, R, p) };
  };
  const layers = [
    { el: shell, frame: p => { const b = box(p); // same shape type in every keyframe (compositable)
        return { clipPath: `inset(${b.t}px ${g.W - b.r}px ${g.H - b.b}px ${b.l}px round ${b.rad}px)`,
                 opacity: smooth(0, 0.1, p) }; } },
    { el: shadow, frame: p => { const b = box(p); // exact affine copy of the clip box
        return { transform: `translate(${b.l}px,${b.t}px) scale(${(b.r - b.l) / g.W},${(b.b - b.t) / g.H})`,
                 opacity: smooth(0.05, 0.7, p) }; } },
    { el: content, frame: p => ({ opacity: smooth(0.86, 1, p) }) },
  ];
  const pour = createPour(layers, { onSettled: open => { root.dataset.state = open ? 'open' : 'closed'; } });

  return {
    open(x, y) {
      root.dataset.state = 'moving';
      if (!pour.moving) {
        const r = root.getBoundingClientRect(), h = BEAD / 2;
        const clamp = (v, max) => Math.min(max - h, Math.max(h, v)); // clip cannot paint outside the box
        g = { W: r.width, H: r.height, cx: clamp(x - r.left, r.width), cy: clamp(y - r.top, r.height) };
      }
      pour.open();
    },
    close() { root.dataset.state = 'moving'; pour.close(); },
  };
}
```

### 3.3 Candidate 3: seven-slice shell (Candidate 2's look, transforms only)

**Layer structure** (DOM only):

```
.pour
  .pour-shadow
  .slice.tl  .slice.tr  .slice.bl  .slice.br   four RM×RM corners, each rounded on its outer corner
  .slice.top  .slice.bot                        full-width strips, RM tall
  .slice.mid                                    full size
  .pour-body                                    content wrapper; gets the real background and hairline at rest
    .pour-content
```

**What animates:** all `transform: translate() scale()` about `0 0`, derived from the same box as §3.2.
- **Corners:** translate only. With the bead set to 2R (12px for R = 6), the corner scale `k = rad/RM` stays at 1. For other radii the corners also scale by `k`, which never exceeds 1.
- **Strips:** scale x.
- **Middle band:** scales x and y.
- **Overlap:** every slice overlaps its neighbours by 0.5px.
- **Shadow plate:** as in §3.2.
- **Body:** rides the box; content squish is at most about 8% once content is half-visible.
- **Content:** opacity.
- **Non-compositor properties:** none.

**How the shadow stays intact:** it is a sibling plate and nothing clips.

**Rest state:** when settled open, `[data-state=open]` hides the slices and paints the static card background and hairline on `.pour-body`, which gives identical pixels for an opaque surface. On close the rig switches back on at `frame(1)` in the same task.

**Close back to the click point, reversal mid-way, and reduced motion:** as §3.2 and §3.0.

**GPU and paint cost** (**Mine**, estimates):
- About 9 composited layers, zero per-frame paint.
- GPU memory is about 3–3.5× the surface area: about 7MB for a 320×400 menu at DPR 2. **Not for the fullscreen map** (roughly 100MB).

**Hard requirement:** the surface token must be **opaque** in both themes, because translucent surfaces show darker seams where slices overlap.

**Lab risks:** seam hairlines on dark backgrounds, which vary by engine (**U**); and the 1px hairline border is only present at rest.

```js
/* CSS (surface colour MUST be opaque: overlapping slices would show seams if translucent)
.pour{position:fixed;isolation:isolate}  .pour[data-state=closed]{display:none}
.pour-shadow{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;
  border-radius:var(--r-card);box-shadow:var(--elev-2)}
.slice{position:absolute;left:0;top:0;transform-origin:0 0;background:var(--surface-raised)}
.slice.c{width:var(--rm);height:var(--rm)}  .slice.tl{border-top-left-radius:var(--rm)} (tr/bl/br alike)
.slice.edge{width:100%;height:var(--rm)}    .slice.mid{width:100%;height:100%}
.pour-body{position:absolute;inset:0;transform-origin:0 0;border-radius:var(--r-card)}
.pour[data-state=open] .slice{display:none}               swap to the static card when settled
.pour[data-state=open] .pour-body{background:var(--surface-raised);border:1px solid var(--hairline)}
*/
import { createPour, smooth, lerp } from './pour-core.js';
const BEAD = 12; // = 2R for R = 6: the corners only translate, never scale

export function slicePour(root, R = 6) {
  const q = s => root.querySelector(s), RM = Math.max(BEAD / 2, R);
  const [tl, tr, bl, br, top, bot, mid] = ['tl', 'tr', 'bl', 'br', 'top', 'bot', 'mid'].map(c => q('.slice.' + c));
  const shadow = q('.pour-shadow'), body = q('.pour-body'), content = q('.pour-content');
  let g = null;
  root.style.setProperty('--rm', RM + 'px');

  const box = p => { const ax = p ** 0.85, ay = p ** 1.15, h = BEAD / 2;
    return { l: lerp(g.cx - h, 0, ax), r: lerp(g.cx + h, g.W, ax), t: lerp(g.cy - h, 0, ay),
             b: lerp(g.cy + h, g.H, ay), rad: lerp(h, R, p) }; };
  const T = (x, y, sx = 1, sy = sx) => ({ transform: `translate(${x}px,${y}px) scale(${sx},${sy})` });
  const O = 0.5; // half-pixel overlap hides anti-aliasing seams between slices
  const piece = (el, f) => ({ el, frame: p => { const b = box(p); return f(b, b.rad / RM, b.r - b.l, b.b - b.t, p); } });
  const layers = [
    piece(tl, (b, k) => T(b.l, b.t, k)),
    piece(tr, (b, k) => T(b.r - b.rad, b.t, k)),
    piece(bl, (b, k) => T(b.l, b.b - b.rad, k)),
    piece(br, (b, k) => T(b.r - b.rad, b.b - b.rad, k)),
    piece(top, (b, k, w) => T(b.l + b.rad - O, b.t, (w - 2 * b.rad + 2 * O) / g.W, k)),
    piece(bot, (b, k, w) => T(b.l + b.rad - O, b.b - b.rad, (w - 2 * b.rad + 2 * O) / g.W, k)),
    piece(mid, (b, k, w, h) => T(b.l, b.t + b.rad - O, w / g.W, (h - 2 * b.rad + 2 * O) / g.H)),
    piece(shadow, (b, k, w, h, p) => ({ ...T(b.l, b.t, w / g.W, h / g.H), opacity: smooth(0.05, 0.7, p) })),
    piece(body, (b, k, w, h) => T(b.l, b.t, w / g.W, h / g.H)), // content rides the box, squish <= 10% while visible
    { el: content, frame: p => ({ opacity: smooth(0.86, 1, p) }) },
  ];
  const pour = createPour(layers, { onSettled: open => { root.dataset.state = open ? 'open' : 'closed'; } });
  return {
    open(x, y) { root.dataset.state = 'moving';
      if (!pour.moving) { const r = root.getBoundingClientRect(), h = BEAD / 2;
        const c = (v, m) => Math.min(m - h, Math.max(h, v));
        g = { W: r.width, H: r.height, cx: c(x - r.left, r.width), cy: c(y - r.top, r.height) }; }
      pour.open(); },
    close() { root.dataset.state = 'moving'; pour.close(); }, // slices back on, static card off
  };
}
```

### 3.4 Surface mapping (proposal for Gate A)

| Surface | Recommendation |
|---|---|
| Dropdown menus (200–320px) | Any of the three. The lab should show all three here. |
| Settings sheet, side card sheet (~400px) | Candidate 1 or 2. Replaces today's `clip-path: circle()`. |
| Docs viewer, fullscreen map | Candidate 1, without the shadow plate. Layer size rules out Candidates 2 and 3 there. |

---

## 4. Pitfalls found in the sources

1. **Clip-path and mask clip the element's own box-shadow.** The Chromium thread noted that you "still need to create a second element which matches the clip path so that the box shadow tracks" (S10, **V**). Put the shadow on a sibling plate, never on the clipped element, and don't bring back the negative-inset workaround.
2. **Don't animate `box-shadow`, because it repaints every frame.** Animate the opacity and transform of a pre-rendered shadow layer instead (S3, **V**). Chromium has a `CompositeBoxShadowAnimation` flag with no status, meaning it is not enabled (S6, **V**).
3. **Animating a mask repaints every frame:** a paint count over 1,000 in Chrome, and jank in Firefox (S13, **V**). Motion ranks `mask-image` gradients as paint-tier (S4, **V**).
4. **CSS custom properties trigger paint when animated, even inside `opacity`.** Inherited ones can force style recalculation across a subtree; one site measured 8ms a frame (S4, **V**). If any `@property` is animated, use `inherits: false` and set it on the element itself.
5. **`filter: blur()` gets costly fast** with blur radius and layer size, and it enlarges the layer (S4, **V**). Blurs above about 10px were flagged in Framer (S4).
6. **Safari drops hardware acceleration at `playbackRate ≠ 1`** (S4, **V**). Don't use `reverse()` or `updatePlaybackRate(-1)` for interruption; re-bake instead.
7. **`reverse()` mirrors the easing,** so an ease-out entry becomes a sluggish ease-in exit. Give the collapse its own curve (S1, **V**). Setting `playbackRate` directly can jump; `updatePlaybackRate` exists for that reason (S23, **V**).
8. **A static `linear()` easing is stateless.** Interrupting restarts from rest with no velocity continuity (S24, **V**).
9. **View Transitions cannot be interrupted.** You finish or skip; a new call skips the running one (S4, S22, **V**). The default group also animates `width` and `height` (S4, S31, **V**). Element scoping is Chrome 147+ only (S22, **V**).
10. **Counter-scaling has known issues:** blurry text on low-DPI screens from scale × counter-scale rounding (S1, **V**), and it doesn't correct `border-radius` (S31, **V**). Scale also distorts radius and shadow unless corrected per frame (S5, **V**).
11. **Keep scale at or below 1.** Safari renders scaled-up layers poorly (S30, **U**, forum). All candidates here scale down from final size.
12. **Gooey filter pitfalls:**
    - the filter must go on the container;
    - it needs bleed or an expanded filter region, or the edges clip;
    - it is heavy on large areas;
    - it destroys content legibility (S14, S15, **V**);
    - the filtered wrapper's stacking context traps pointer events (S16, **V**);
    - Safari iOS shows banding with a multiplier above 20 (S16, **U**).
13. **SVG filter pitfalls:**
    - set `color-interpolation-filters="sRGB"`;
    - Safari's turbulence tiling breaks under transform (S19, **U**);
    - WebKit's `feImage` fails on HTML (S18, **V**, 2021);
    - animating `baseFrequency` regenerates noise every frame (S17, **V**).
14. **Safari ignores `mask-image: url(#svgMask)` on HTML elements** (S20, **V**).
15. **Top-layer exit animations:**
    - `overlay` is Chromium only (S27, **V**);
    - Firefox popovers did not animate their exit via `display … allow-discrete` (S27, **U** for current Firefox).

    Drive entry and exit with WAAPI and hide the element in `onSettled(0)`, as the core does, rather than relying on discrete CSS transitions.
16. **Composited clip-path falls back to the main thread** for mismatched shape types, fragmented layout and global values (S7, **V**), and reportedly for a delay (S8, **U**). Keep all keyframes in the same `inset(… round …)` form and use no delay.
17. **Layer promotion costs GPU memory,** and `will-change` should be used sparingly (S4, **V**). The core cancels animations at rest so the layers are released.
18. **Don't animate from `scale(0)`** ("nothing appears from nothing"), and make the transform origin-aware (S28, **V**). The 18px bead satisfies both, and it matches the canon's "pours out of the exact point clicked".
19. **Internal lesson (REBUILD_PLAN §1):** the v27 to v39 layers fought because each had its own timeline. Everything here derives from one `p` on one clock.

---

## 5. Sources

All sources were seen on **2026-09-25** through Exa unless noted otherwise. "Published" is the page's own date where it has one.

| ID | Source | Published | Label | Used for |
|---|---|---|---|---|
| S1 | Chrome for Developers, "Building performant expand & collapse animations" (Lewis, McGruer): https://developer.chrome.com/blog/performant-expand-and-collapse | 2017-03-23 | V | Baked keyframes, counter-scale, reverse feel, blurry text |
| S2 | CSS-Tricks, "Performant Expandable Animations: Building Keyframes on the Fly": https://css-tricks.com/performant-expandable-animations-building-keyframes-on-the-fly/ | 2020-04-01 | V | Baked keyframes in production, linear or step-end timing |
| S3 | Tobias Ahlin, "How to animate box-shadow with silky smooth performance": https://tobiasahlin.com/blog/how-to-animate-box-shadow/ | 2015-11-18 | V | Shadow on its own layer |
| S4 | Motion Magazine (Matt Perry), "The Web Animation Performance Tier List": https://motion.dev/magazine/web-animation-performance-tier-list | 2025-11-04 | V (full fetch) | Tiers; CSS variable costs; Safari playbackRate; blur cost; View Transitions interruption |
| S5 | Motion docs, performance and layout animations: https://motion.dev/docs/performance, https://motion.dev/docs/react-layout-animations | undated | V | Scale distorts radius and shadow; per-frame correction |
| S6 | Chromium `runtime_enabled_features.json5` (main), raw file via GitHub mirror with curl: https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/platform/runtime_enabled_features.json5 | fetched 2026-09-25 | V | `CompositeClipPathAnimation: stable`; `CompositeBoxShadowAnimation` has no status |
| S7 | Chromium commits on composited clip-path: https://github.com/chromium/chromium/commit/c56accca9bc839c7f84a93745e8c2edd60345734 (fallback when not compositable), https://github.com/chromium/chromium/commit/a8d12b9a39f99c946cfa67ff93affbd685d06749 (fragmented layout), https://github.com/chromium/chromium/commit/f75681bc2c06cfa202fe71e5829014bd82a7d281 (global values), https://github.com/chromium/chromium/commit/99771df45c050b17535b5c2e1a7358b481e2b49a (paint worklet), https://github.com/chromium/chromium/commit/88c7c57793735cfd2edadf92d7454037c8f0c51b | 2021–2024 (88c7c57: 2024-11-22) | V | Mechanism and main-thread fallbacks |
| S8 | Alex Russell on Bluesky (mirror): https://couchsky.app/u/infrequently.org/p/3mqmwsgxjqk25 | 2026-07-14 | U | "About to be GPU accelerated"; delay bailout |
| S9 | Chrome for Developers, "Updates in hardware-accelerated animation capabilities": https://developer.chrome.com/blog/hardware-accelerated-animations | 2021-02-22 | V (historical) | clip-path compositing was planned |
| S10 | Chromium paint-dev, "Moving clip-path to the compositor": https://groups.google.com/a/chromium.org/g/paint-dev/c/3bXUo0X3C5I | c. 2016–2018 | V (historical); U (Safari claim, today) | Clipped shadow needs a matching element |
| S11 | Codrops (Michelle Barker), "Dynamic CSS Masks with Custom Properties and GSAP": https://tympanus.net/codrops/2021/05/04/dynamic-css-masks-with-custom-properties-and-gsap/ | 2021-05-04 | V | `@property` mask technique |
| S12 | Artur Bień, "Fancy reveal animations with CSS masks and @property": https://www.expensive.toys/blog/fancy-css-reveal-effects | undated | V | Feathered iris mask |
| S13 | Component Odyssey, "The Two Lines of CSS That Tanked Performance": https://component-odyssey.com/articles/13-improving-performance-by-changing-two-lines-of-css | 2024-08-21 | V | Mask animation paint count; Firefox jank |
| S14 | CSS-Tricks (Lucas Bebber), "The Gooey Effect": https://css-tricks.com/gooey-effect/ | 2015-02-04 | V | Metaball filter and its limits |
| S15 | Codrops, "Creative Gooey Effects": https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/ | 2015-03-10 | V | `feComposite atop`; resource cost |
| S16 | Animation Patterns, gooey metaball and construction: https://animationpatterns.art/animations/gooey-blob-metaball-filter/, https://animationpatterns.art/animations/gooey-blob-construction/ | 2026-04-18, 2026-04-25 | V (text); U (Safari banding) | Filter region; re-rasterisation; pointer trap |
| S17 | Daring Designs, "feTurbulence & feDisplacementMap": https://daring-designs.com/blog/warping-elements-with-feturbulence-and-fedisplacementmap | undated | V | Cost of animating turbulence |
| S18 | Smashing Magazine, "A Deep Dive Into … SVG Displacement Filtering": https://www.smashingmagazine.com/2021/09/deep-dive-wonderful-world-svg-displacement-filtering/ | 2021-09-01 | V | WebKit `feImage` on HTML |
| S19 | Stack Overflow 72633099, Safari turbulence tiling: https://stackoverflow.com/questions/72633099/svg-filter-turbulence-not-rendering-well-on-safari | undated | U | Safari filter bugs; sRGB hygiene |
| S20 | MDN browser-compat-data issue 26358: https://github.com/mdn/browser-compat-data/issues/26358 | 2025-03-31 | V | Safari ignores `mask-image: url(#svg)` on HTML |
| S21 | Codrops shader reveals: https://tympanus.net/codrops/2024/12/02/how-to-code-a-shader-based-reveal-effect-with-react-three-fiber-glsl/, https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/ | 2024-12-02, 2025-01-22 | V | SDF plus noise reveal |
| S22 | MDN "Using the View Transition API": https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using ; Chrome "element-scoped view transitions": https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions ; web-features explorer: https://web-platform-dx.github.io/web-features-explorer/features/view-transitions-element-scoped/ | 2026-03-27 (Chrome) | V | Circle reveal; skip-on-restart; Chrome 147 only |
| S23 | MDN `Animation.reverse()`, `updatePlaybackRate()`: https://developer.mozilla.org/en-US/docs/Web/API/Animation/reverse , https://developer.mozilla.org/en-US/docs/Web/API/Animation/updatePlaybackRate | 2024-03-11 (updatePlaybackRate) | V | Reversal semantics; jump risk |
| S24 | Carmen Ansio, "Spring Animations in Pure CSS with linear()": https://www.carmenansio.com/articles/spring-physics-css/ ; tw-spring README: https://github.com/petekp/tw-spring | 2026-04-12; undated | V (tw-spring's claims are its own) | `linear()` is stateless; re-bake from analytic (x, v) |
| S25 | web-features explorer, `linear()` easing: https://web-platform-dx.github.io/web-features-explorer/features/linear-easing/ | fetched 2026-09-25 | V | Chrome 113, Firefox 112, Safari 17.2; Widely available 2026-06-11 |
| S26 | webstatus.dev and web.dev, `@property`: https://webstatus.dev/features/registered-custom-properties , https://web.dev/blog/at-property-baseline | 2024-07-12 | V | Chrome 85, Safari 16.4, Firefox 128 |
| S27 | GoogleChrome modern-web-guidance, top-layer animation: https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-behaviors/animate-to-from-top-layer.md ; Bugzilla 1912426: https://bugzilla.mozilla.org/show_bug.cgi?id=1912426 | undated; bug filed in the Firefox 129/130 era | V; U (current Firefox status) | `@starting-style`, `allow-discrete` and `overlay` support; Firefox exit bug |
| S28 | Emil Kowalski, "7 Practical Animation Tips": https://emilkowal.ski/ui/7-practical-animation-tips (and his skill file on GitHub) | undated | V | Never from `scale(0)`; origin-aware popovers |
| S29 | Stack Overflow 68434666, nine-slice transform rounded rectangle: https://stackoverflow.com/questions/68434666/how-to-smoothly-animate-position-size-of-an-rounded-rectangle | undated | V (community) | Slice technique |
| S30 | GSAP forum, "How to keep border-radius during a scale animation?": https://gsap.com/community/forums/topic/41390-how-to-keep-border-radius-during-a-scale-animation/ | 2024-07-27 | U (forum) | Safari scale above 1 |
| S31 | CSSWG issue 13064, width/height as scale: https://github.com/w3c/csswg-drafts/issues/13064 | 2025-11-05 | V | Counter-scale doesn't fix radius; View Transitions animate width/height |

**Checked but not found:** chromestatus.com has no entry for composited clip-path animations (API search, 2026-09-25). The Chrome milestone that first enabled `CompositeClipPathAnimation` by default therefore remains **U**. The lab should confirm compositing directly: a DevTools Performance trace should show no main-thread paint for the clip.

## 6. Open items for the lab

1. Confirm whether Chromium is compositing Candidate 2's clip-path: check paint flashing and the trace in the current Chrome stable.
2. Tune the anisotropy exponents (0.85 and 1.15) and the bead size by eye in both themes. Tune the content gate (0.86) too: a lower gate lengthens the content fade on close but shows content earlier on open.
3. Check the seven-slice seams on the dark theme at DPR 1 and 2, in Chrome, Safari and Firefox.
4. Measure raster time on open and per-frame cost for each candidate on the ~400px side sheet. Record the results with `H.cast()`.
