# EXPIRA Console: Phase 0 audit (v39 build, before the v41 rebuild)

Read-only audit of `index.html` at commit `39fcdb3` (496 KB, 2,878 lines: CSS on lines 5–1341, HTML on 1342–1459, JS on 1460–2878).
It's the input to Phases 2–4 of `REBUILD_PLAN.md`. Every number comes from a script or a browser probe you can re-run:

- `qa/audit_probe.js` takes screenshots, measures idle rAF and running animations, records the sidebar fold positions and computes token contrast, in light and dark.
- `qa/audit_probe2.js` records the pour timeline frame by frame with a real pointer click, and Dispatch stillness over 12 s.
- The static counts come from a Python pass over the file. The method is described in each section.

Baseline: `qa/smoke.js` reports **0 errors in light and dark** (desks: research ×2, finance, legal).

Screenshots are in `qa/audit/` (committed JPEGs; the full PNGs regenerate into `qa/out/audit/`):
`01_onload_*` (the console opens the latest chat, not the start page), `02_example_light`, `03_dispatch_{light,dark}`, `04_optmenu_light`, `05_settings_dark`, `06_run_dark`.

---

## 1. Feature inventory (parity checklist, confirmed against the code)

| # | Checklist item | Confirmed | Where (JS section header or line) | Notes |
|---|---|---|---|---|
| 1 | Chat library: new chat, recents, pins, folders, archive, rename, delete with undo, search `#find` | ✔ | "chat library" L1595, drag onto folder L1628, context menus L1634, rename in place L1657 | Also: **drag a chat onto a folder**; folders persist in `localStorage["expira.folders"]`. |
| 2 | Composer: grows to 7 lines, attachments `#attIn`, quoting, `#docBtn`, options (depth, web, desks), model credit `#cst` | ✔ | composer CSS L193, quoting L1775, attachments L2615, options L1957 | Options menu also has **Freshness (90 days / 12 mo / Any)** and **Client-safe** (firewall), not in the checklist. Also paste or drop of images, and the lightbox `#lbx` (L2638). |
| 3 | Orchestrated run: plan, desks, arbiter and claims ledger, cited answer, audit of factual lines, redo and escalation | ✔ | planner stream parser L2372, runtime L2508+, ledger 87 refs, audit 26 refs, `redo` 11 refs | Also **steer** (a note typed mid-run rides into the next desk prompt, `steerNote()`), the **firewall pass** (L2848) and a run log to `db` (see the persistence notes below). |
| 4 | Exa search and fetch, graceful path when not connected | ✔ | "the web: Exa" L2381 | Web option shows "Checking Exa…" then disables itself with a hint when the connector is absent. |
| 5 | Exhibits: key figures, bars, ranked, stacked, donut, waterfall, ranges, timeline, comparison table, sources, PNG and table views | ✔ | charts L1530, more forms L2537, PNG at 3× L2579 | Also: chart hover crosshair with in-plate readout (L1560), figures count up (L2107), "In this answer" section index. |
| 6 | Documents: kernel builder (6 types), thumbnails, docs viewer, save through downloads | ✔ | kernel builder L2407, kernel library L2456, doc matching L2468, viewer L2486, thumbnails L2500 | Also a **Files** nav (every document across chats, `#filesNav`); save falls back to clipboard copy when `downloads` is missing. |
| 7 | The Dispatch: live fill-in, ledger, desks, map, colophon | ✔ | L2011–2041 | Also the stats row (elapsed, desks, tokens, grounded) and the firewall pull quote. |
| 8 | Maps: Field and Flow, mini maps, full screen, focus lens, replay | ✔ | L2111–2370 | "Focus lens" is the **`#sheet`** side card (`openSheet`, L2333). The view choice persists in `localStorage["expira.mapView"]`. |
| 9 | Spectrogram | ✔ | `class Spectro` L2044 | Decorative; see defect D-S1. |
| 10 | Selection bar: ask, explain, define `#defc`, quote | ✔ | L1780 | Also **Copy**. |
| 11 | Message actions: copy, edit and resend, retry, open threads | ✔ | L1813 | Answer footer: Copy · Retry · Dispatch. Open threads are claim cards with ↗. |
| 12 | Palette, shortcuts, toasts, tips, jump, settings, themes, reduced motion | ✔ | palette L1987, tips L1484, toasts L1482, appearance L1841, jump `#jump` | Settings has **8 tabs**: general, appearance, briefs, map, kernel, files, library, about. Shortcuts: ⌘K, ⌘, ⌥N, ⌥L, F2, /, Esc, ?. |
| 13 | Persistence through `db`, and the example chat | ⚠ | store L1582, runtime L2508 | **Chats are not in `db`.** See below. |

**Persistence as it actually works (must be preserved exactly, or changed only by Duke's decision):**
- Chats: `localStorage["expira.v6"]` (reads the `v5` key as a fallback). They are per viewer and per browser.
- Prefs `expira.prefs`, theme `expira.theme`, options `expira.opt`, folders `expira.folders`, run view `expira.runview`, map view `expira.mapView`, and the example-dismissed flag `expira.noExample` all live in `localStorage`.
- `db` is used once: `db.collection("runs").doc("r"+Date.now()).set({ts,…})`, a run log.
- The capabilities the page calls are `sample`, `db`, `mcp` (Exa) and `downloads`.
- **Decision for Gate A or Phase 2:** the plan's §6 says "saved chats in `db`". Parity means keeping chats in `localStorage` and the run log in `db`. Moving chats into `db` is a feature change: shared across viewers, and needing a migration. I've treated it as out of scope unless Duke asks.

**Features the §6 checklist misses (add them to the Phase 4 parity check):**
- Freshness option;
- Client-safe firewall toggle, and the firewall pull quote;
- steer mid-run;
- image paste, drop and lightbox;
- chart crosshair readout;
- figure count-up;
- "In this answer" index;
- Files nav and the Files and Library settings tabs;
- settings tabs Briefs, Map and Kernel (with a kernel template preview that opens in `#docv`);
- the start page (dateline, greeting with the name pref, "In this issue" contents, grain on the mark);
- text-size and density prefs (`data-text`, `data-density`);
- motion pref (`PREF.motion`) and grain pref (`PREF.grain`);
- theme change through a View Transition (`startViewTransition`);
- the run pill with elapsed time;
- "Latest ↓" jump;
- feathered scroll edges (`.fz`/`.fzx`);
- off-screen run cards pause (IntersectionObserver `RUNIO`);
- the ready and linked indicator (`#ready`; `#sig` is hidden, see D-X2).

---

## 2. Motion inventory

### 2.1 Vocabulary counts

| Measure | Count | Plan target |
|---|---|---|
| `@keyframes` | **48** (47 names; `flow` is defined twice, L536 and L1036, and the later one wins) | per unit, from tokens |
| distinct `cubic-bezier` | **15** | ≤ 3 curves + 1 spring |
| distinct durations in CSS | **63** (from 14 ms to 9 s) | 5 tokens |
| `!important` | **43** | a justified few |
| `linear()` uses | 3 (the JS springs write `--sp-*`) | spring token |
| `prefers-reduced-motion` blocks | 9 | one pattern per unit |
| `requestAnimationFrame` call sites | 33 | one loop per map + one-shot schedulers |
| `.animate()` (WAAPI) | 15 | — |
| `setInterval` loops | 3 (grain 42 ms, dateline 15 s, run timer) | — |
| layout reads in JS | 28 `getBoundingClientRect`, 19 `offset*` | none inside loops |

**Curves that overshoot, breaking the no-bounce rule:**
- `cubic-bezier(.3,1.5,.4,1)` is the `--sp-jelly` fallback (L1047);
- `cubic-bezier(.2,.9,.25,1.04)` is the `--sp-soft` fallback (L1047);
- `cubic-bezier(.2,.9,.25,1.06)` is used by the lightbox (L2645).

**The generated springs overshoot too.** `SPRING` (L2532) builds `jelly` k=420 c=25 (ζ≈0.61, ~9% overshoot), `soft` k=210 c=24 (ζ≈0.83, ~1%) and `snap` k=520 c=34 (ζ≈0.75, ~3%). None is critically damped, although the canon requires ζ = 1.

### 2.2 Keyframes

"Non-compositor" means the animation touches something other than transform or opacity, which the canon forbids. "Loops" means an infinite animation.

| Keyframes | Line | Section | Animates | Used by (selector: duration, easing) | Loops | Flags |
|---|---|---|---|---|---|---|
| `blurIn` | 48 | shared entrance | filter, opacity, transform | `.bi` .9s soft-close; `.runpill` .6s; `.ready` .9s … | | filter blur |
| `word` | 51 | shared entrance | opacity | `.w` .32s ease-out (overridden by `inkw` in v29) | | superseded |
| `breathe` | 151 | main | opacity | `.busy .dsp-btn i` 2.4s; `.runpill i` 2s; `.ready i` 3.2s | yes | only while busy |
| `breath` | 173 | start | background-position | `.greet em` 9s | yes | non-compositor; runs forever on the start page |
| `settle` | 175 | start | filter, opacity, transform | `.greet .ch` .9s | | filter blur |
| `float` | 180 | start | transform | `.hero .mark-w` 7s | yes | runs forever on the start page |
| `colon` | 181 | start | opacity | `.colon` 2s | yes | runs forever (dateline clock) |
| `tick` | 223 | composer | opacity | `.menu … .ck::after` .4s ease | | |
| `blink` | 301 | figures | opacity | `.caret` 1s; `.delib p.typing::after` 1s | yes | while streaming |
| `shim` | 315 | working block | background-position | `.think.running .lbl`, `.desk .st.live`, `.run.running .lbl` 2.6s linear | yes | non-compositor |
| `sheen` | 322 | sheen | transform | `.sheen::before` 2.4s | | |
| `evIn` | 333 | sheen | opacity, transform | `.row`, `.menu .sub.open`, `.ev li` .4–.5s | | |
| `fct` | 339 | sheen | opacity | `.running .glyph .f1–3` 1.6s | yes | while running |
| `open` | 361 | Dispatch | clip-path, opacity, transform | `.desk` .9s | | non-compositor |
| `reveal` | 403 | Dispatch | clip-path, opacity | `.olog .tx` 1s | | non-compositor |
| `toast` | 449 | toasts | opacity, transform | `.toast` 2.2s ease | | entry and exit share one curve |
| `ndIn` | 518 | map | filter, opacity | `.map .nd`, `.field .fn` .9s | | filter; node group parts animate separately |
| `flow` ×2 | 536 / 1036 | map / v29 | stroke-dashoffset | `.map .fl`, `.field .lf` .9s linear | yes | non-compositor; duplicate definition |
| `ring` | 599 | v14 | opacity, transform | `.field .st-on .ring` 1.9s | yes | the ring animates apart from its node |
| `glide` | 699 | settings mini interface | transform | `.pv-in.full .mo::after` 2.6s | yes | loops inside settings previews |
| `docwrite` | 890 | document button | stroke-dashoffset | `#docBtn[data-on] svg path` .9s | | non-compositor |
| `drip` | 935 | liquid | opacity, transform | `.strm li.new::after` .36s; `[data-docsave].drip::after` .5s | | |
| `jelly` | 936 | liquid | transform | `.strm .se.new::before` .7s | | |
| `ink` | 937 | liquid | filter, opacity, transform | `.run .now.ink`, `.strm li.new>span`, `.att .an` .5–.7s | | filter blur |
| `swell` | 938 | liquid | background, box-shadow | `.strm .se.mo.new` 1.6s | | non-compositor; animates a shadow |
| `pour` | 949 | map toggle | clip-path, opacity | `.run .mapw.show` .75s | | non-compositor; a fourth "pour" with no shadow guard |
| `acIn` | 965 | v26 | border-radius, opacity, transform | `.ac` .62s | | superseded by `acIn2` |
| `acOut` | 966 | v26 | filter, opacity, transform | `.ac.out` .32s | | exit faster than entry is right, but uses a filter |
| `fillup` | 967 | v26 | clip-path | `.ac .th img` .95s; `.docc .th iframe` 1.1s | | non-compositor |
| `fuIn` | 1011 | v28 | border-radius, opacity, transform | `.fu` .7s | | superseded by `fuIn2` |
| `docIn` | 1013 | v28 | border-radius, opacity, transform | `.bot.bi .docc` .8s | | border-radius |
| `inkw` | 1020 | v29 | filter, opacity, transform | `.w` .56s | | filter per streamed word (many layers) |
| `caretJ` | 1022 | v29 | transform | `.caret` 1.1s | yes | |
| `mnb` | 1081 | v30 | transform | `.mini .md.nb`, `.mini .mn.nb .halo` with `--sp-jelly` | | **overshoots** (jelly spring) |
| `halo` | 1083 | v30 | opacity, transform | `.mini .halo` 1.2s | yes | the halo animates apart from its dot |
| `acIn2` | 1113 | v30 | opacity, transform | `.ac` jelly spring | | **overshoots** |
| `fuIn2` | 1115 | v30 | opacity, transform | `.fu` soft spring | | slight overshoot |
| `fgY` | 1165 | v31 | transform | `.fig.in .bar` jelly spring; `.sg` soft; `.ar` .9s | | **bars overshoot** |
| `fgX` | 1166 | v31 | transform | `.fig.in .hb`, `.tb2` jelly spring | | **overshoots** |
| `fgJ` | 1167 | v31 | transform | `.fig.in .re` jelly spring | | **overshoots** |
| `fgDrop` | 1168 | v31 | opacity, transform | `.fig.in .wb` jelly spring | | **overshoots** |
| `fgDraw` | 1169 | v31 | stroke-dashoffset | `.fig.in .ln` 1.1s; `.mini .me.ne` .5s | | non-compositor (acceptable for line draw; tokenise as `--t-draw`) |
| `fgSweep` | 1170 | v31 | stroke-dasharray | `.fig.in .dn` .95s | | non-compositor |
| `spkIn` | 1213 | v33 | opacity, transform | `.spk` soft spring | | |
| `spin` | 1225 | v33 | transform | `.cbar .spn` 1s linear | yes | a stock spinner (canon: loading is a mercury bead) |
| `facet` | 1248 | v33 | opacity | `.hero .mark polygon` 7s | yes | runs forever on the start page |
| `sparkP` | 1292 | v35 | opacity | `.busy .cbar .spark` 2.4s | yes | while busy |

### 2.3 JavaScript motion loops

| Loop | Where | Trigger | Sleeps? | Rule broken |
|---|---|---|---|---|
| Liquid menu pour (WAAPI, 26 clip-path keyframes) | L2514–2520 | MutationObserver on `.open` of `.menu`, `#mfs`, `#setMenu`, `#docv` | n/a | see D-P1–P5 |
| Mercury segment slide | L2521 | selection change in segs and tabs | n/a | |
| Settings nav indicator | L2874–2876 | MutationObserver on the nav | n/a | |
| FlowMap step loop | L2220 | births, particles | yes (stops when `!mv && !pl.length`) | |
| FieldMap force loop | L2310 | births, drag, replay | yes, **after ~5 s**: measured 66 → 58 → 34 → 0 rAF/s over 2 s windows after opening the Dispatch | acceptable but slow to settle; tie to an alpha threshold |
| `wakeMaps` | L2325 | Dispatch, `#mfs` or settings class change | one-shot, **reads layout** (`getBoundingClientRect`) at 0, 420 and 900 ms | layout reads in rAF |
| Live spectrogram loop | L2687–2688 | a run | throttled to 24 fps while running | draws `Math.random()` per pixel (D-S1) |
| Figure count-up | L2109 | figure enters view | one-shot | |
| Scroll-to-end batcher | L2658 | streaming | one-shot per frame | |
| **GOO WebGL metaballs** | L1738–1754 | `open(null)` (start page) | **no**: a `setTimeout` loop every 42 ms | **the canvas is `display:none`** (CSS `#goo{display:none}`), so it renders invisibly at 24 fps forever on the start page |
| **Grain** | L1473–1478 | start page, `PREF.grain` (default **true**) | no: `setInterval` every 42 ms | **stillness**: rewrites a CSS variable 24×/s, causing style recalc and repaint forever on the start page |
| Dateline clock | L1825 | always | every 15 s | fine |

---

## 3. Token inventory

**Tokens defined:** 65 custom properties. The light set is on `:root` (L7–20). The dark set is written **twice, verbatim**, once under `@media (prefers-color-scheme:dark) :root:not([data-theme=light])` and once under `:root[data-theme=dark]`. The build should generate both from one source.

| Area | What is in use | Problems |
|---|---|---|
| Colour | Surfaces `--bg --side --panel --well --sheet`; ink `--ink --text --soft --mute`; lines `--line --line-2 --line-3`; gold `--gold --gold-2 --gold-wash --head --head-glow`; states `--ok --bad --warn`; series `--s1…--s5`; mark `--mark-a --mark-b` | 33 hex and 24 rgba literals **outside** the token blocks (17 and 17 distinct), e.g. `#000` ×12, `#fff`, `#1f2a40`, `#9aa1ae`, `#2f6b4f`, and the raw palette repeated in the settings previews. 10 `color-mix()` calls derive ad-hoc tints. The spectrogram and GOO read tokens at run time but convert them with a hex-only parser (falls back to grey on any non-hex token). |
| Series / chart | `--s1 #4a6fd0` (blue), `--s2 #b88a2c`, `--s3 #1f9a86`, `--s4 #c9644e`, `--s5 #9a66b8`; dark is nearly identical | Not validated with the dataviz validator. The primary bar colour is a saturated blue that isn't in the brand (navy #0B2368 / gold). The dark series are near-copies, not designed for dark. |
| Contrast (AA 4.5:1 for text) | Probe in `qa/out/audit/probe.json` | **Light:** `--mute` is 2.75–3.16 on every surface (used for captions, ticks and micro labels); `--gold` as text is 2.99–3.43 (e.g. "Fig. 1", "FILED FROM ILOILO", `c2` markers); `--gold-2` 2.05–2.36. **Dark:** `--mute` is 3.94–4.44 (fails at small sizes). Everything else passes (ink 13.8–15.5, soft 7.1–8.0 light). |
| Type | Families: `--f-display` (Libre Baskerville), `--f-body` (Inter), loaded from Google Fonts | Body is **14.5px** (canon 13px). 17 distinct sizes: 7.5, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16.5. **Below the 9.5px floor:** 7.5px ×1, 8.5px ×4, 9px ×3, and canvas tick labels at 8.5px. |
| Spacing | `--u:4px` is defined and **never used** (0 uses) | 237 distinct padding, margin and gap values; no scale. |
| Radius | 20 distinct values | Outside the 3–8px canon: 1px, 2px (×13), 10px ×4, 14px, 18px ×2, 999px ×3 (pills), plus asymmetric blobs. |
| Elevation | `--shadow` is one token per theme | 22 distinct `box-shadow` literals elsewhere; `swell` animates a box-shadow. |
| Motion | `--soft-close`, `--release`, `--in:180ms`, `--out:600ms`, `--reveal:1100ms`, `--sp-*` | See §2. `--out` (600 ms) is slower than the plan's `--t-exit` (300–380 ms). |
| Z-index | 16 values: 0–3, 40, 60, 70–74, 80, 85, 88, 95, 96 | No layer scale; tokenise as named layers. |
| Selectors | **125 selectors are defined more than once** (e.g. `.fig svg.ch` ×4; `.bot`, `.ans`, `.acts`, `.run .ev` ×3) | This is the version-layer stacking. |

**Version layers** (CSS comment headers): v13, v14, v15, v16, v17, v18, v19, v20, v25, v26, v27, v28, v29, v30, v31, v32, v33, v34, v35, v36, v37 and v39 (three blocks). 22 layers on top of the unversioned base.

---

## 4. Defects

**Pour (menus, sheets, cards).** Measured on `#optMenu` with a real pointer click (`audit_probe2.js`):
- **D-P1 Slow entry.** The shell animation runs **820 ms** (902 ms for the tint). The plan's `--t-enter` is 180–240 ms. Menus bigger than 250,000 px² run 920 ms.
- **D-P2 Content before shell.** Opacity is already 0.86 at 79 ms, while the clip path is still a thin pill. The canon says content appears after the shell has formed.
- **D-P3 Snap at the end.** The last keyframe swaps to a different path (the negative inset "past the shadow"). At ~847 ms the path jumps from `M 9 363.6…` to `M -2.67 406.7…` in one frame, and then `clip-path` drops to `none` at ~1030 ms. That's a visible discontinuity at the end of every pour.
- **D-P4 Inverted timing.** Entry is 820 ms but **close is ~200 ms** (opacity < 0.02 at 230 ms, `visibility:hidden` only at ~570 ms). The canon wants fast entry and soft close; this is the reverse.
- **D-P5 Only some opens pour.** The pour runs only when the opener was a `pointerdown` or Enter/Space target (`lastBtn`). Opening by shortcut (⌘, for settings), by the palette or by code gets only the `.18s!important` fade. The side sheet has its own `circle()` clip (v39 block), `.run .mapw` has its own `pour` keyframes, and `.desk` has `open`: four pour systems.
- **D-P6 Layers fight.** There are four simultaneous WAAPI animations: clip path, tint, `composite:"add"` scale squeeze and a gold meniscus element appended to the menu. Plus the CSS `.menu.open` transition with `!important` on duration and delay.

**Continuity / teleports.**
- **D-C1 Sidebar fold/unfold teleports.** There are two buttons: `#fold` in the sidebar brand row and `#unfold` in the header.
  - On fold, `#fold` slides out with the sidebar (x 207 → −49) while `#unfold` switches from `display:none` to visible at x = 114 and slides with the main column to x = 16.
  - On unfold, `#unfold` goes back to `display:none` instantly.
  - So one control disappears and another appears; nothing travels.
- **D-C2** The side sheet closes with a different curve than it opens, and the lightbox uses an overshooting curve.

**Order of appearance.**
- **D-O1** Node parts animate independently: the node core uses `ndIn`, `.ring` has its own infinite `ring`, and the mini map `.halo` has its own `halo` loop plus `mnb`. The glow, ring and label aren't one transform group, so they can drift and lag.
- **D-O2** Edges animate with `flow` (dash offset) on a CSS timer that isn't tied to their ends' births. In replay, the order comes from `transitionDelay = col*.24+.08` (L2201), estimated from layout column rather than execution timestamps.
- **D-O3** On replay, Dispatch desks use `animation-delay:.12+i*.06` (step index), not the recorded execution times.

**Stillness and performance.**
- **D-X1** The GOO WebGL loop renders at 24 fps into a `display:none` canvas on the start page (wasted GPU, never visible).
- **D-X2** The grain interval (24 fps, on by default) and the `breath`, `float`, `facet` and `colon` loops run forever on the start page.
- **D-X3** The FieldMap takes ~5 s to fall asleep after the Dispatch opens (≈60 rAF/s meanwhile).
- **D-X4** `wakeMaps` does layout reads in rAF and in timeouts.
- **D-X5** `inkw` puts a `filter: blur` animation on every streamed word.
- No long frames (>50 ms) were observed while settled in either theme (Long Animation Frames API, 3 s windows). Idle after a run: 0.5–0.8 rAF/s and 0 running animations.

**Spectrogram.**
- **D-S1** It isn't a spectrogram. `Spectro.evolve` decays bins and adds `Math.random()` Gaussian bumps scaled by per-desk amplitude, and `col()` multiplies each pixel by `0.82+Math.random()*0.3`. Replays of the same run look different every time. There's no FFT and no legend of what the brightness means.
- **D-S2** Time tick labels (8.5px) are painted into the scrolling canvas and collide with the band gutter (see `03_dispatch_dark`, "0:30" under band IV).
- **D-S3** The colour LUT (well → dim → gold → ink) isn't validated and isn't perceptually uniform. `recolor()` remaps pixels by nearest colour, which is lossy.

**Theme and colour.**
- **D-T1** The contrast failures listed in §3 (light `--mute` and gold text; dark `--mute`).
- **D-T2** Chart bars use `--s1` saturated blue in both themes (see `06_run_dark`, `02_example_light`), off-brand, and colour alone separates series in the map legend (the dots only).
- **D-T3** The dark theme set is duplicated verbatim.

**Dead, stale or overlapping code.**
- **D-X2b** `#sig` is `display:none!important` (v37) but still updated by the runtime.
- `mountMaps()` starts with `return;` (dead). `.stg-n nav>.merc` is hidden (a replaced mercury indicator).
- `word`, `acIn` and `fuIn` are superseded by `inkw`, `acIn2` and `fuIn2`, and `flow` is defined twice.
- The settings footer says **"EXPIRA Console · v29"** (stale; the build is v39/v40).
- The example chat and `qa/mocks.js` still stage a **"Decision" desk and legend entry**, although v40 folded the decision desk into the orchestrator (the live planner no longer offers it; it's only in the example data). Keep it for parity, or relabel it; that's for Duke to decide.
- The Dispatch stat "143 tokens" for a 94 s, four-desk run counts only the desks' final notes (`tok(out)`). It's the wrong number to headline.

**Clipped shadows.** None observed at rest. The v39 negative inset protects menu shadows at the end of the pour, but not during it: the path hugs the body until the last keyframe (D-P3), so the shadow is cut for ~95% of the animation. `.run .mapw` `pour` and `.desk` `open` clip with `inset(0…)` and cut any shadow.

---

## 5. What this means for the rebuild

1. **Phase 2.2 tokens:**
   - Replace every overshooting curve, and all three springs, with one critically damped spring;
   - collapse 63 durations into the five motion tokens;
   - collapse 15 curves into `--ease-out`, `--ease-in-soft` and the spring;
   - introduce the 4px spacing scale (the existing `--u` is unused);
   - fix `--mute` and gold text contrast in both themes;
   - generate the dark block once;
   - add a z-index layer scale.
2. **Phase 3.3:** one pour system for all surfaces (menus, settings, sheet, `#docv`, `#mfs`, map toggle, desks), triggered by `open`, not by `lastBtn`, with the shadow on its own layer.
3. **Phase 3.1:** one travelling sidebar button (D-C1).
4. **Phase 3.4:** node groups under one transform; births and edges driven by execution timestamps (D-O1–O3).
5. **Phase 3.6:** a deterministic, honest spectrogram (D-S1–S3).
6. **Start page:** delete GOO, and make grain a one-shot or a static texture (D-X1, D-X2).
7. **Parity additions** from §1 go into the Phase 4 checklist. **Open question for Duke:** keep chats in `localStorage` (today) or move them to `db`.
