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
- [ ] Phase 2.2: tokens landed; version layers, dead rules and `!important` removed
  - [x] Version layers folded: the 22 layers (953 rules) now live in 17 units under `src/units/`, 131 repeated selectors merged; computed styles identical to v39 in 20 UI states × 2 themes (`qa/styles.js`), pixels identical (`qa/diff.js`), smoke 0 errors
  - [x] `!important` 43 → 20, each remaining one commented (motion kill switches, paused off-screen surfaces, figures at rest, hidden edges, and the v39 pour holds that Phase 3.3 removes); 41 dead rules (`.tg`, `.spark`, `.chron`, `.think*`, `.mrow`, `.progress`, `.tx-s/.tx-l`, `html.theming`…), 3 superseded keyframes (`word`, `acIn`, `fuIn`), the hidden `#sig` and the dead JS (`mountMaps`, `archivedMenu`, `staffHTML`, `youHTML_old`) removed; computed styles otherwise identical
  - [x] Tokens: `src/tokens.css` from the lab, snapped to the brand stack (dark gold → brand `#C9A35C`, gold as text → brand hue darkened to `#846936`, raster ramp ends on brand navy; light decorative gold stays `#A8862F` because brand `#AE8A47` is under 3:1 on the sidebar). The dark set is written once (`@dark{}` in build.py). 910 literals replaced by `qa/tools/tokenize.py`: type sizes snap to the Gate A scale (body 13px, floor 9.5px), radii to 3–8px, z-index to named layers in the v39 order, spacing to a 4px scale with half steps below 20px, shadows to `--e1…3`/`--e-side`, colours to tokens (mask gradients keep `#000`: alpha, not colour). Smoke 0 errors
  - [ ] Motion: overshooting curves and springs replaced with the Gate A vocabulary
  - [ ] Gate A defaults: Arbiter label, real orchestrator effort, GOO removed, still grain, settings version label
- [ ] Phase 3.1: shell and travelling sidebar button
- [ ] Phase 3.2: composer
- [ ] Phase 3.3: pour across all menus, sheets and cards
- [ ] Phase 3.4: maps (model, Field, Flow, mini, full screen)
- [ ] Phase 3.5: Dispatch
- [ ] Phase 3.6: spectrogram
- [ ] Phase 3.7: thread and messages
- [ ] Phase 3.8: everything else, with hovers everywhere
- [ ] Phase 4: review PASS, performance, accessibility
- [ ] Phase 5: shipped as v41; **Gate B passed**

### Resume here

- **State (2026-09-25, end of session 2):** Phases 0 and 1 are done and Gate A is passed. The decisions are in `GATE_A.md` §Decisions and DESIGN_ENGINE. Nothing in `index.html` has changed yet.
- **Next: Phase 2.1**, a pure restructure. Split `index.html` into `src/` (tokens placeholder, base, `units/<unit>/`, `core/`, `shell.html`) plus a deterministic `build.py`.
  - The output must behave identically, and `qa/smoke.js` must report 0 errors in light and dark.
  - Add a byte- or behaviour-diff check: rebuilt vs original.
  - Commit.
- **Then Phase 2.2:**
  - move `qa/lab/tokens.proposed.css` into `src/tokens.css`;
  - replace every literal with a token;
  - delete version layers, dead rules and `!important`;
  - replace all overshooting springs and curves with the Gate A vocabulary;
  - apply the §5 defaults of `GATE_A.md` (Arbiter label, real orchestrator effort, remove GOO, still grain);
  - commit, then push at the end of Phase 2.
- **Tools:**
  - the lab: `qa/lab/cast.js`, then `qa/lab/strips.py` (needs `pip install pillow`);
  - the audit probes: `qa/audit_probe.js` and `qa/audit_probe2.js`;
  - the session prompt: `SESSION_3_PROMPT.md`.
