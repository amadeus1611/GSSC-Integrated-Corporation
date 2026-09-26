# EXPIRA Console v41: the clean rebuild

This is the plan for rebuilding the whole console as if every good idea from v13 to v40 had been designed at once. There is one system, no version layers and no patches stacked on patches. Every feature that works today keeps working.

Read it fully before starting, then work down **Progress** at the bottom. Tick items as you finish them and commit after each unit. The rebuild can span several sessions, and each session resumes from Progress.

**Read first:** `CLAUDE.md`, `expira-system/DESIGN_ENGINE.md` (the canon), `orchestrator/POLICY.md`, then this file.

---

## 1. Why: diagnosis of the current build

- **CSS stacked by version.** `index.html` (~496 KB) carries rule layers from `/* v13 */` to `/* v39 */`, and each layer overrides the ones before it. The live behaviour is whichever rule happens to win.
- **Motion vocabulary out of control:**
  - 13 distinct `cubic-bezier` curves, including one with overshoot, `cubic-bezier(.3,1.5,.4,1)`, which breaks the no-bounce rule;
  - more than 20 distinct durations (.2s to 2.6s);
  - 48 `@keyframes`;
  - 32 `!important`.
- **The liquid card pour** has been reworked in v27, v38, v38.2 and v39. Its layers now fight each other: the clip path, the meniscus band, the tint and the negative inset.
- **Linked assets move separately.** A glow, its ring and its node can drift or animate out of step. They should be one object.
- **Order of appearance is not guaranteed** everywhere, although DESIGN_ENGINE §3 requires it: a child never before its parent, and an edge only after both of its ends.
- **Continuity breaks.** For example, the sidebar fold (`#fold`) and unfold (`#unfold`) buttons teleport instead of travelling.

## 2. Non-negotiables (from Duke and the canon)

1. **Feature parity.** Everything in the parity checklist (§6) still works, including saved chats in `db` and the example chat.
2. **One single-file artifact** at the same URL (https://claude.ai/artifact/LcLXJASXhWZ56g74sHVRxt). Capabilities stay the same: mcp Exa (`web_search_exa`, `web_fetch_exa`), sample, db and downloads.
3. **Master-template aesthetics** (DESIGN_ENGINE §1–2):
   - Roman-numeral sectioning;
   - hairlines with a 34px gold lead-in;
   - navy-ruled tables;
   - Libre Baskerville with italic accents for display, Inter for UI;
   - small type (body 13px, chrome 10.5–11px, micro text never below 9.5px);
   - tabular numbers;
   - micro radii of 3–8px.
4. **Motion** (DESIGN_ENGINE §3):
   - premium and liquid, with no bounce and no overshoot;
   - **fast entry, soft close**;
   - animate transform and opacity only, with one sanctioned exception: the light enter and exit blur on small surfaces (Gate A, DESIGN_ENGINE §3);
   - exits are a luxury soft close (`--ease-soft-close`, `--t-exit` 380 ms);
   - never clip a shadow;
   - stillness once settled, and anything off-screen pauses;
   - reduced motion means state changes only.
5. **Each unit owns its choreography.** Shared *tokens* give the vocabulary: durations, easings, springs, colours, spacing. Each unit's own file decides *how* it moves. Nothing is centralised into one global animation controller.
6. **Subtle at rest, detailed on demand.** Every surface shows a quiet summary, and hover or click expands to more detail.
7. **Everything interactive has considered motion:** hover, press, focus, enter, exit, and continuity between states.
8. **Colour:**
   - light and dark are each designed on purpose; dark is not an inversion of light;
   - every colour comes from a token;
   - text meets AA contrast in both themes;
   - chart and data colours are validated with the `dataviz` skill's palette validator in both modes.

## 3. The approach

### 3.1 Source tree and build (committed, no scratchpad dependency)

```
expira-system/console/
  src/
    tokens.css        colour (light + dark), type, spacing, radius, elevation, motion tokens
    base.css          reset, page, typography primitives
    units/<unit>/     one folder per unit: <unit>.css + <unit>.js (+ <unit>.html partial if needed)
    core/             runtime glue: state, db, sample/mcp wrappers, router, kernel loader
    shell.html        page skeleton with one include marker per unit
  build.py            concatenates src/ into index.html (one <style>, one <script>), deterministic
  qa/                 harness.js, mocks.js, smoke.js (already committed), plus the new tests
  index.html          BUILD OUTPUT — never hand-edit after the rebuild lands
```

- **`build.py` is deterministic.** It checks that every include resolves, and that there are no duplicate ids and no duplicate CSS selectors across units.
- **CLAUDE.md changes.** After the rebuild, update its console section so edits go to `src/` and `index.html` is always rebuilt from source.

### 3.2 Motion tokens (the whole vocabulary)

Approved at Gate A. The source is `qa/lab/tokens.proposed.css`.

| Token | Value | Use |
|---|---|---|
| `--t-instant` | 90ms | hover colour and opacity |
| `--t-enter` | 200ms | fast entry of menus, cards and toasts |
| `--t-exit` | 380ms | the luxury soft close, slower than entry |
| `--t-move` | 380ms | layout moves, FLIP, the sidebar |
| `--t-draw` | 420ms × length (1–2.5) | edge drawing and chart pours |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | entry deceleration |
| `--ease-soft-close` | `cubic-bezier(.4,0,.1,1)` | exit: travels, then decelerates into rest |
| `--ease-inout` | `cubic-bezier(.65,0,.35,1)` | travel between two held states |
| `--spring` | critically damped `linear()` (ζ = 1) | chrome, FLIP, the sidebar button, the pour |
| `--blur-enter` / `--blur-exit` | 4px / 3px | the light blur on small surfaces only (DESIGN_ENGINE §3) |
| `--stagger` | 40ms | siblings queued by the order helper |

- **At most three curves** plus the spring. Tune the exact values in the lab (§4, Phase 1) and write them into DESIGN_ENGINE.
- **Stagger and order helper.** Provide one small helper that queues appearances in dependency order (parent before child, edge after both ends, glow after its edge). Units call it; it never animates anything itself.

### 3.3 Linked assets are one object

- A node, its halo ring, its glow and its label form one group that moves with one transform.
- An edge's particles belong to that edge, and a light belongs to the thing it lights.
- Nothing linked may drift, lag or pop independently.

### 3.4 Storage and portability (Gate A)

Duke's brief: other people will run this repo and publish the console on their own Claude accounts, so storage must be the most robust option for any owner, not tied to Duke.

- **One adapter:** `src/core/store.js` exposes `list / get / put / remove / subscribe`. Units never touch `localStorage` or `db` directly.
- **Backend chosen at run time:**
  1. The artifact `db` capability, namespaced per viewer. This is used only if the capability can keep one viewer's chats private from other viewers of the same artifact.
  2. Otherwise `localStorage`, which is per browser and private.
  - **Before building, load the `artifact-capabilities` skill and confirm the db's access model** (shared or per-viewer, identity, limits). Record the finding here.
  - `localStorage` is always a write-through cache, so the console works offline and when `db` is absent.
  - **Finding (2026-09-26, runtime contract 0.2.60):** `db` is shared by default; each viewer's `data/users/<id>/` subtree is private, the owner included, but the id comes only from the `user` capability's `id()`, which resolves null unless the page declares `user`. The live page declares mcp, sample, db and downloads, not `user`, so today the adapter runs on `localStorage`. The db path is built and tested (`qa/store.js`, with a fake per-viewer db) and turns on by itself once `user` is declared; declaring it is Duke's call at Gate B. Limits: 256 KiB per document (larger chats stay local), 5,000 documents per artifact. Only Contributors and up can write their own subtree.
- **Migration:** on first load, import `expira.v6` (and `v5`) chats, prefs, folders and options into the adapter. Never delete the old keys in the same release.
- **Export and import:** the whole library as one JSON file, through `downloads`, for moving devices or owners.
- **Portability:**
  - no personal data hard-coded: the name, initials and org in the account row and greeting come from prefs or viewer identity, with neutral defaults;
  - the run log stays in `db` `runs`;
  - the capabilities list is unchanged.

---

## 4. Phases and gates

### Phase 0: audit (read only)

Write the results to `expira-system/console/AUDIT.md`:
1. **Feature inventory:** confirm the parity checklist (§6) against the code, and add anything it misses.
2. **Motion inventory:** every keyframe, transition and rAF loop, with its unit, what triggers it, and any rule it breaks.
3. **Token inventory:** colours, fonts and spacing literals in use, and where they are duplicated or inconsistent.
4. **Defects:** ordering violations, clipped shadows, teleports, linked assets that drift, theme colour mismatches, overlapping or dead code. Include screenshots from `qa/`.

### Phase 1: research and lab

**Research.** Launch three `research-high` agents in parallel, using Exa. Each writes to `expira-system/console/research/`:
- **R1, a new pour.** Find liquid-reveal techniques that keep the shadow intact and cost little, for example:
  - a mask-image radial bloom with a feathered, noise-edged front from the click point;
  - a surface-tension droplet: a small bead that spreads and settles, with the shadow on its own layer scaling in step;
  - an SVG metaball bead that hands off to the real card;
  - an ink-in-water spread along a flow-field edge.

  Rank them against our style (calm, premium, no bounce), GPU cost and shadow safety.
- **R2, execution maps.** How the best tools draw agent runs, traces and schedulers: Perfetto, Temporal UI, LangGraph Studio, Chrome tracing, airline and ops dashboards. Cover time axes, lanes, node size by volume, traffic on edges, "current task" lighting, and progressive disclosure.
- **R3, the spectrogram.** Honest FFT and spectrogram design:
  - windowing;
  - log or mel frequency axes;
  - decay;
  - perceptual single-hue colour maps for light and dark;
  - legends and hover readouts;
  - what signal we actually have (token streams per desk over time) and what it should mean to Duke.

**Lab.** Build `expira-system/console/qa/lab/` as a single page containing:
1. the **top three pour candidates**, each on a real card with a real shadow, in both themes;
2. a **motion token sheet**: entry, exit, move and spring, side by side;
3. a **palette sheet**: surfaces, ink, accents, the gold, and the chart ramp in light and dark, with validator output.

Record short screencasts with `H.cast()` and send frames or GIFs to Duke.

**GATE A: Duke picks the pour and approves the motion and colour tokens.** Stop and wait. Write his choices into DESIGN_ENGINE.

### Phase 2: foundation

1. **Pure restructure.** Split today's `index.html` into `src/` plus `build.py`, with no design change. The smoke test must pass and the output must behave identically. Commit.
2. **Tokens.**
   - Land `tokens.css`: motion, colour in light and dark, the type scale, a spacing scale on a 4px base, elevation (shadow tokens designed per theme), and radii.
   - Replace every literal with a token.
   - Delete all version layers, dead rules and `!important` uses (keep only a justified few, commented).
   - Commit.

### Phase 3: rebuild unit by unit

For each unit: rebuild it in `src/units/<unit>/`, run the smoke test, take screenshots of both themes plus reduced motion, tick Progress, and commit.

1. **Shell.**
   - The sidebar fold and unfold is one button that *travels*. Use FLIP from the sidebar header to the main header, with the icon morphing (not swapping) and the sidebar width easing on `--t-move`.
   - Header, crumb and dateline.
2. **Composer (message bar).**
   - Premium but sleek: one hairline container, a quiet resting state, a focus state that brightens the hairline and lifts the elevation one step.
   - The send control morphs through idle, ready, sending and stop.
   - The mode and effort chips and the model credit sit on one baseline.
   - Attachments drip out of the composer.
   - It grows from one line to seven on a spring.
3. **The pour: menus, popovers, sheets and cards.** Implement the approved pour once, as each unit's own choreography built on the shared tokens.
   - Fast entry from the click point, soft close back to it.
   - Content arrives after the shell has formed.
   - The shadow is on its own layer and is never clipped.
   - Covers `#optMenu`, `#docMenu`, `#setMenu`, `#cpop`, `#sheet`, the palette and the context menus.
4. **Maps** (`FieldMap`, `FlowMap`, the mini maps, full screen `#mfs`): one graph model, several views.
   - **Model:** nodes are the orchestrator, the desks, tools, web calls and documents. Edges are delegation, routing, returns and citations. Each has a timestamp and a token count.
   - **Nodes:** area proportional to tokens (sqrt scale, clamped). The halo ring, glow and label are one group. Nodes bud on birth (swell, neck, release) with no pauses.
   - **Order:** births are strictly in execution order, live and on replay. An edge draws only after both of its ends exist, and beads and glows only after their edge.
   - **Edges:** traffic density proportional to token throughput, particles flow in the direction of the work, and busier lines are visibly busier while staying calm.
   - **Current task:** a single light sits on the active node and follows the work, and the path it arrived by glows faintly.
   - **Time:** FlowMap gets a real time axis with lanes per role, and delegation and routing are drawn as the orchestrator's decisions.
   - **Detail on demand:** hovering a node shows tokens, time, effort and state; clicking opens the focus lens with the full detail.
   - **Performance:** one rAF loop per map, asleep when idle. No layout reads inside loops. Canvas or SVG, whichever the research shows to be smoother at 60fps.
5. **The Dispatch** (`#dsp`): rebuild the layout on the master template.
   - Roman-numeral sections, the claims ledger, desks, the map, and the colophon.
   - It fills in as the work unfolds, in execution order.
   - Same data, designed as one piece.
6. **The token raster** (replaces `Spectro`, `#spec`; changed at Gate A per `research/R3_spectrogram.md`):
   - one row per desk (plus O and A), time left to right, each ¼ s cell shaded by that desk's chunk count in five fixed classes (empty · 1 · 2 · 3–4 · 5+);
   - thinking is drawn as dotted cells, so colour never carries it alone;
   - the ramps are `--seq-1…4` (navy in light, gold in dark), validated;
   - it is deterministic: the same run always paints the same image;
   - a legend, a hover readout and a cross-band time cursor;
   - it paints only when a frame arrives, and is still when settled;
   - the optional one-desk "Rhythm" FFT diagnostic (R3 §c) is off by default;
   - the mini strips per desk use the same code.
7. **Thread and messages:**
   - the bot message fill-in and the thinking line;
   - claim cards and open threads;
   - exhibits and charts, poured in using the dataviz skill's rules;
   - the selection bar, quoting, and message actions.
8. **Everything else:** the palette (`#pal`), toasts, tips, the docs viewer (`#docv`), settings (`#stgP`, `#stgT`), the jump button, search, files, the chat library, and the Web and Exa affordances.
   - Every interactive element gets hover, press and focus states, with motion from the tokens.

### Phase 4: independent review

1. **`reviewer-high`** reviews the build against DESIGN_ENGINE, this plan's non-negotiables and the parity checklist. It returns a PASS or FAIL list.
2. **Performance:**
   - a Chrome trace of a full mock run;
   - no long frames over 50ms while settled;
   - maps asleep when idle;
   - off-screen surfaces paused.
3. **Accessibility:**
   - keyboard paths;
   - focus rings;
   - reduced motion;
   - contrast in both themes;
   - nothing that relies on colour alone.
4. **Fix every FAIL.** After 2 redos on one item, ask Duke.

### Phase 5: ship

1. Build `index.html` and run the smoke test. It must report 0 errors in both themes.
2. Read the live artifact first, then republish to the same URL with `capabilities` omitted.
3. Add a v41 entry to the DESIGN_ENGINE change log, update CLAUDE.md for the `src/` workflow, commit and push.

**GATE B: Duke reviews the published console.**

## 5. How to work (per POLICY)

- **The main session builds the console inline**, at high effort. It is one surface, so don't split it across builders.
- **Sub-agents** are for Phase 1 research only (3 × `research-high` in parallel) and the Phase 4 review (`reviewer-high`).
- **Hand-offs** follow the POLICY format: goal, how to tell it's done, files, constraints by section, what's already decided, output location.
- **Commits:** one per unit, on `claude/wizardly-ptolemy-6q4ter`, pushed after each phase.
- **Tests:** `NODE_PATH=/opt/node22/lib/node_modules node expira-system/console/qa/smoke.js`. Screenshots land in `qa/out/`, which is git-ignored.

## 6. Parity checklist (verify in Phase 0; must all pass in Phase 4)

- [ ] Chat library: new chat, recents, pins, folders, archive, rename, delete with undo, search (`#find`)
- [ ] Composer: grows to seven lines, attachments (`#attIn`), quoting a passage, document request (`#docBtn`), options (depth, web, desks), model credit (`#cst`)
- [ ] Orchestrated run: plan, desks (research, finance, legal, builder), arbiter and claims ledger, answer with citations, audit of factual lines, redo and escalation
- [ ] Web research through Exa (search and fetch), with a graceful path when it isn't connected
- [ ] Exhibits: key figures, all chart forms (bars, ranked, stacked, donut, waterfall, ranges, timeline), comparison table, sources, PNG and table views
- [ ] Documents: kernel builder (quotation, company profile, contract, secretary's certificate, board resolution, notarial acknowledgment), thumbnails, docs viewer, save through downloads
- [ ] The Dispatch: live fill-in, the ledger, desks, map, colophon
- [ ] Maps: Field and Flow, mini maps, full screen, the focus lens, replay
- [ ] Spectrogram
- [ ] Selection bar: ask, explain, define (`#defc`), quote
- [ ] Message actions: copy, edit and resend, retry, open threads
- [ ] Palette and keyboard shortcuts, toasts, tips, jump, settings sheet, themes (system, light, dark), reduced motion
- [ ] Persistence through the storage adapter (§3.4), migration from `expira.v6`, library export and import, and the example chat

## 7. Progress

- [x] Phase 0: AUDIT.md written (2026-09-25, session 2). Open question for Duke: chats live in `localStorage`, not `db` (AUDIT §1).
- [x] Phase 1: research R1–R3 written; lab built; **Gate A passed** (Duke picked the pour: **A, surface-tension droplet**, no meniscus rim)
  - [x] R1 (pour), R2 (maps) and R3 (spectrogram) written to `research/` (2026-09-25)
  - [x] Lab built: `qa/lab/index.html` (3 pours × 2 themes, motion token sheet, palette sheet with live validator); `qa/lab/cast.js` + `strips.py` capture exact frames; 0 errors both themes
  - [x] Gate A decided 2026-09-25 (`GATE_A.md` §Decisions), written into DESIGN_ENGINE §2, §3 and the change log
- [x] Phase 2.1: pure restructure into `src/` plus `build.py`, parity smoke passes (2026-09-25, session 3: 80 files; the rebuilt `index.html` is byte-identical to v39, sha256 `a697549cd1499e54…`; `qa/diff.js` reports identical DOM and pixels in both themes; the 7 cross-unit selectors v39 already doubled are listed in `build.py` `KNOWN_DUPES` for 2.2)
- [x] Phase 2.2: tokens landed; version layers, dead rules and `!important` removed (2026-09-26)
  - [x] Version layers folded: the 22 layers (953 rules) now live in 17 units under `src/units/`, 131 repeated selectors merged; computed styles identical to v39 in 20 UI states × 2 themes (`qa/styles.js`), pixels identical (`qa/diff.js`), smoke 0 errors
  - [x] `!important` 43 → 20, each remaining one commented (motion kill switches, paused off-screen surfaces, figures at rest, hidden edges, and the v39 pour holds that Phase 3.3 removes); 41 dead rules (`.tg`, `.spark`, `.chron`, `.think*`, `.mrow`, `.progress`, `.tx-s/.tx-l`, `html.theming`…), 3 superseded keyframes (`word`, `acIn`, `fuIn`), the hidden `#sig` and the dead JS (`mountMaps`, `archivedMenu`, `staffHTML`, `youHTML_old`) removed; computed styles otherwise identical
  - [x] Tokens: `src/tokens.css` from the lab, snapped to the brand stack (dark gold → brand `#C9A35C`, gold as text → brand hue darkened to `#846936`, raster ramp ends on brand navy; light decorative gold stays `#A8862F` because brand `#AE8A47` is under 3:1 on the sidebar). The dark set is written once (`@dark{}` in build.py). 910 literals replaced by `qa/tools/tokenize.py`: type sizes snap to the Gate A scale (body 13px, floor 9.5px), radii to 3–8px, z-index to named layers in the v39 order, spacing to a 4px scale with half steps below 20px, shadows to `--e1…3`/`--e-side`, colours to tokens (mask gradients keep `#000`: alpha, not colour). Smoke 0 errors
  - [x] Motion: `qa/tools/motion.py` put 254 transitions and animations on the vocabulary (base rule = exit with `--t-exit`/`--ease-soft-close`, state rule = entry with `--t-instant`/`--t-enter` and `--ease-out`, layout travel `--t-move`, pours `--t-draw`, delays in `--stagger`, live-only loops on `--t-loop`/`--t-beat`/`--t-flow`); the three overshooting springs and the lightbox curve are gone (`core/motion.js` gives WAAPI the same tokens); the forever start-page loops (`float`, `facet`, `breath`, `colon`) are removed. Only `units/pour/pour.js` keeps its own curves until Phase 3.3 replaces it
  - [x] Gate A defaults: "Decision agent" and the example decision desk read **Arbiter** everywhere (map column, node, tooltip, sheet, feed, settings, prompts; the stored role key stays `decision` so saved chats still load); the orchestrator node shows its real effort, `HIGH` (the planner runs at the complex tier); the hidden WebGL `#goo` loop and `units/start/goo.js` are deleted; the grain renders once as a still texture (the 24 fps interval and `GRAIN.run` are gone; the settings switch still shows or hides it); the settings footer and About read v41
- [x] Phase 3.1: shell and travelling sidebar button (2026-09-26): `#fold` is now the only sidebar button. `setFold()` in `units/shell/shell.js` moves it between the sidebar header and the main header and plays it back with FLIP on `--t-move`/`--ease-inout`, the same move as the sidebar margin, and the title slides aside on the same move; its icon morphs (the pane narrows, the divider slides, the chevron turns), with the hover nudge on its own `translate` so a click mid-hover still morphs at full length. The palette, `/` and the mobile library route through `setFold`. The frame rules (`.side`, `.top`) moved into the shell unit. Shots: `qa/shots.js shell`; smoke 0 errors
- [x] Phase 3.2: composer (2026-09-26): one hairline container that rests quiet (`--line-2`, `--e1`), brightens on hover, and on focus brightens the hairline and lifts to `--e2`; the send control is one SVG that morphs (idle well, ready ink, on send the arrow leaves through the top while the stop square forms on the spring, gold with the arrow back while steering); the overshooting squash in `setBusy` is gone; the prompt grows from one line to seven on `--spring` (`grow()` measures at auto, then transitions from the current height); the chips and the model credit sit on one baseline; the rotating placeholder no longer blurs words; the `.pw` rules moved home from figures. Attachments keep their drip. Shots: `qa/shots.js composer`; smoke 0 errors
- [x] Phase 3.3: pour across all menus, sheets and cards (2026-09-26): `core/pour.js` is the droplet from `qa/lab/pours.js` A, one critically damped spring (open ~220 ms, close ~360 ms) driving the surface (`scale`, opacity), a shadow plate of its own, the bead and the content (fades in after the shell forms; un-blurs on small surfaces only). It follows each surface's open state, pours from the pointer (else the focused control, the caller's anchor, or the centre) and drains back to the same point; reversal carries position and speed; reduced motion is a state change. Each unit attaches its own surface: `#optMenu`, `#docMenu`, `#acct`, `#ctx`, `#setMenu`, `#pal`, `#sheet`, `#cpop` (now shown by class), `#docv`, `#mfs`. The v39 clip-path pour, its meniscus rim and all nine `!important` pour holds are gone (`!important` now 11, all motion rests and kill switches); the old `pour.js` extras moved to `menus/mercury.js`, `run/keys.js` and `dispatch/rest.js`. Shots: `qa/shots.js pour` (mid-flight and open for each surface; no pour layer is left at rest); smoke 0 errors
- [x] Phase 3.4: maps (2026-09-26), per `research/R2_maps.md`: a canvas-first hybrid.
  - **Model:** `maps/graph.js` `runGraph(w)` gives every node and edge a birth, start and end in ms since the run began, tokens, state and a strictly increasing `seq`. Runs now record `tb`/`ts`/`te` per desk and `t` per page (`core/run.js`); older records fall back to the phase clock, the feed, the token signal, then dependencies and durations. The sig factor is settled: a sig value is chars/4, so it is tokens. Legacy node ids (`o`, `v`, `a{i}`, `c`, `s:host`, `more`, `ans`, `doc`) are kept, so the sheet is unchanged.
  - **Plate:** `maps/canvas.js` `MapBase`: canvas plus DOM (an ordered list of buttons in execution order for focus, screen readers and the sheet's anchor; the tooltip, anchored to the node, 120 ms open, 80 ms close, 4 Hz while live; a polite live region). One rAF loop per map, asleep when still or unseen; colours re-read on theme change; the gold light with hysteresis and its 28% arrival path. Hover dims to 35%; the lens (the sheet open on a node) dims to 20%.
  - **Field:** x is the birth wave, y a seeded d3-style simulation (forces still scaled by Settings); area is tokens on an absolute sqrt scale; buds on a metaball neck (critically damped, ~700 ms), births paced 140 ms in `seq` order; edges draw in (280 ms) only after both ends; particles at the live token rate, 72 px/s (110 full screen), capped at 300; state glyphs (queued dashed, running ring, thinking gapped ring, failed ✕, held double ring).
  - **Flow:** a real time axis (domain on a spring while live, 1-2-5 ticks, DOM labels), lanes born with their first node (Orchestrator, Research, Finance, Legal, Drafting, Arbiter, Exa), packed sub-rows, bars with queued stub, feathered head, throughput ribbon and web ticks, decision diamonds, delegation, dependency and return edges, the now-line, particles capped at 60, and the critical path underlined once settled.
  - **Deviations, recorded:** the run card keeps a full inline map (the same class with `card:true`) rather than R2 §3.7's 26–60px strip, because the card's Map view is where people read a run; the radius scale is calibrated to real runs (10px at 1 000 tokens, not 12px at 4 000); the lens dims but does not move a camera, and the full-screen WASD camera, overview strip and replay scrubber (R2 §3.8–3.9) are deferred; sites are not rows in Flow (reach them through Exa's sheet).
  - Removed: the SVG maps, `graphOf`, the goo-filter mini map and its CSS. Shots: `qa/shots.js maps` (replay, settled, hover, lens, card, full screen, live Field and Flow, done); smoke 0 errors
- [x] Phase 3.5: Dispatch (2026-09-26): set on the master template. A masthead (kicker, title, date, standfirst, figures), then Roman-numbered sections that appear in the order the work reaches them: I. The run (Fig. 1 and the orchestrator's log), II. The desks, III. The map (Fig. 2), IV. The ledger; then the firewall pull quote and the colophon. Numbering is a CSS counter, so hidden sections take no number. The figures (elapsed, desks, tokens) and the standfirst now fill in live instead of only at the end. Motion moved to transform and opacity: the panel no longer blurs (a large surface), the desk entry, log reveal, notes and the live status no longer animate clip-path, height or background. Shots: `qa/shots.js dispatch`; smoke 0 errors
- [x] Phase 3.6: the token raster (2026-09-26), replacing `Spectro` per R3: `units/spectro/raster.js`. One row per voice (O, A, then each desk), one ¼ s cell per frame, shaded by tokens streamed in five fixed classes on an absolute scale (empty · 1–5 · 6–12 · 13–24 · 25+ tokens per ¼ s, on `--seq-1…4`); thinking without writing is a dotted hairline. Live, frames are 2px columns filling from the left (the scale halves when full, with a 160 ms crossfade); settled, the run spans the plate. It paints only when a frame arrives (or on resize and theme), from data, so it is deterministic; the rAF loop in `core/run.js` is gone. A legend, an axis in DOM, a cross-band cursor with a data readout (pointer or ←/→ on the focused plate), level markers on the band labels, and a polite summary on settle. The per-desk strips use the same class. Nothing is invented for a real run: a run without a signal shows "No activity was recorded"; only the example chat composes its activity, seeded, from its own recorded timings. Class cut points are set from streaming rates (≈100 tok/s is class 4) and should be re-checked against real runs. The optional Rhythm FFT diagnostic (R3 §3.3) is not built (off by default in the plan). Shots: `qa/shots.js raster`; smoke 0 errors
- [x] Phase 3.7: thread and messages. Blur now only on small surfaces (`--blur-enter`); streamed words, headings, exhibits and the ledger use a transform-and-opacity `rise`. The document sheet and caret no longer overshoot; the live-label shimmer, swell and caret are transform or opacity only. Dead map-toggle code (`.mapt`, `.mapw` markup, `mapH`) removed. The selection bar is clamped to the main column. Shots: `node qa/shots.js thread`.
- [x] Phase 3.8: everything else, with hovers everywhere (2026-09-26)
  - **Storage:** `KV` in `core/prelude.js` (it loads before the prefs) exposes `get / put / remove / list / subscribe`, plus `ready`, `where`, `exportAll`, `importAll`; no unit touches `localStorage` or `db` directly. The v6 key names are kept as the local cache (chats stay under `expira.v6`, v5 is read as a fallback), so there is no copy step and a rollback still reads them. The db path mirrors one document per key and per chat under `data/users/<id>/`, sends only what changed, and hydrates on load (the durable copy wins; browser-only chats are sent up). It is dormant until `user` is declared (see §3.4). `qa/store.js` covers local, db (a fake per-viewer store), export and import.
  - **Library:** Settings › Library exports the whole library as one JSON file through `downloads` (clipboard when absent) and imports one back (merged by id; a foreign file is refused).
  - **No built-in name:** the greeting, account row and initials come from Settings › General (name, full name, organisation); with none set the greeting stands alone and the account row reads "Your account". The example's arbiter note no longer names Duke.
  - **Hovers:** `qa/hovers.js` hovers and focuses every visible control on the start page, the example thread (scrolled), the open run card, the account menu, all eight settings tabs, the palette, search and the Dispatch, in both themes. Fixed: the palette (pointer-following highlight, press state, combobox and listbox semantics), settings inputs, the exhibits and run-card headers, and the focus ring on a chosen segment. What remains is by design: the prompt and send button take their states from the composer container, and a selected tab or row keeps its selected look under hover.
  - Shots: `qa/shots.js rest`; smoke 0 errors.
- [ ] Phase 4: review PASS, performance, accessibility
- [ ] Phase 5: shipped as v41; **Gate B passed**

### Resume here

- **State (2026-09-26, session 3):** Phases 2 and 3 are done and pushed. Smoke reports 0 errors in both themes; `qa/store.js` passes; `qa/hovers.js` shows no gaps beyond the by-design ones in 3.8.
- **Next: Phase 4** (the reviewer-high review, a performance trace and an accessibility pass), then Phase 5 (republish, reading the live artifact first, `capabilities` omitted), then stop at Gate B.
- **For Duke at Gate B:** whether to declare the `user` capability, which turns on private per-viewer storage in the artifact's db.
- **Tools:** `python3 build.py` (and `--check`); `qa/smoke.js`; `qa/styles.js A B` for computed-style diffs across 20 states; `qa/diff.js A B` for DOM and pixels. `.base.html` (git-ignored) is the v39 baseline: `git show 97874b2:expira-system/console/index.html > .base.html`. The lab: `qa/lab/cast.js`, then `qa/lab/strips.py` (needs `pip install pillow`); the audit probes: `qa/audit_probe.js` and `qa/audit_probe2.js`.
