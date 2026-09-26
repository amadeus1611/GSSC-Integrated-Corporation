# EXPIRA design engine

This is the living design system behind everything EXPIRA makes: the Console, the documents it builds, and every new derivative. Read it before designing or building anything, and update it whenever an iteration teaches us something. The latest learnings take precedence over older habits.

## 1. Canon: the design engine's IP

These sources define the house style. Anything new derives from them rather than being invented from scratch.
- **GSSC kernel templates** (`console/lib/gssc-kernel.json`, kernel 2.18.x):
  - the quotation master, `GSSC-QUOTATION-MASTER-v1`;
  - the company profile;
  - the CMSA;
  - the secretary's certificate;
  - the board resolution;
  - the notarial acknowledgment.
- **The master template and its derivatives:**
  - the derivative CSS;
  - the Roman-numeral sectioning;
  - hairline rules with a 34px gold lead-in;
  - navy-ruled tables;
  - pull quotes;
  - the serif display type in italic accents.
- **The EXPIRA mark:** faceted navy stone with a gold vein and one clean fracture. The brand tokens are in `brand_assets/`.

A new derivative, whether a screen, a document or a chart, follows the master template's logic: its hierarchy, rules, spacing rhythm and type pairing. That way it reads as considered and of one family.

## 2. Aesthetic principles

- **Aesthetics come first.** Premium and calm, in the manner of Claude: complex underneath, subtle on the surface. The detail shows only when you look closely.
- **Small type:**
  - body text 13px;
  - chrome 10.5–11px;
  - micro labels 9.5px, never smaller.
- **Lines and shapes:**
  - hairline 1px lines;
  - sharp shapes with micro radii of 3–8px;
  - long, stretched proportions.
- **Density without clutter:**
  - tabular numbers;
  - tracked small caps for labels;
  - colour never carries meaning on its own; pair it with a glyph or a word.
- **Themes:** every colour comes from a token, and dark and light are designed separately rather than one being an inverted copy of the other.
- **Colour stack (Gate A, v41):** derived from the EXPIRA brand stack: navy `#0B1A3F`, slate `#2C3549`, gold `#AE8A47`/`#C9A35C`, ink `#09101E`. Harmony follows good colour theory: a navy-and-gold complementary core, with teal, rust and plum as the accents.
  - **Text.** All text tokens pass AA on every surface in both themes. Gold used as text has its own token, `--gold-ink`; `--gold` is for rules, lead-ins and focus rings only.
  - **Charts.** Fixed order: research navy blue, finance deep gold, builder teal, legal rust, arbiter plum. The palette is validated with the dataviz validator in both modes.
  - **Token raster.** Navy in light and gold in dark, darker or brighter meaning more; validated as an ordinal ramp.
- **No regressions:** each iteration must look at least as well thought out as the last one.

## 3. Motion principles

Motion is the heart of the UX: fidelity in the engine comes first.
- **Liquid, not rigid:**
  - Surfaces open as a non-rigid blob that pours out of the exact point clicked. The corner radii wobble and settle into the card's own radius on a spring, and the surface drains back to the same point when it closes.
  - Content fades in once the shell has formed.
- **Never clip a shadow.** A clip-path reveal on a surface with a shadow must end outside it (negative inset), so the shadow is never cut; the shadow moves with the shape.
- **Springs, not curves.** Use the damped oscillator converted to CSS `linear()`: critically damped, with no overshoot anywhere. No bounce. Carry velocity over on interruption, so opening and closing can reverse mid-way without a jump.
- **Physics, not overlap.** Surfaces that would collide spring aside, each to a free position, and return home afterwards. The main column glides instead of jumping.
- **Order is truth:**
  - a child never appears before its parent;
  - an edge draws only once both ends exist;
  - glows and beads start only after their edge.
  - Maps show the real order of execution, live and on replay.
- **Nodes bud and never jump:** swell, neck, pinch, then release, as one continuous motion with no pauses. Births are queued in execution order, and the Field map reads left to right in that order.
- **Loading is a mercury bead** on a hairline: it stretches with its speed and pools at the ends. It is not a stock progress bar.
- **Stillness when settled:** a finished run animates nothing, and anything off-screen pauses.
- **Reduced motion:** state changes only.
- **The pour (Gate A, v41): the surface-tension droplet.**
  - A small bead leaves the exact point clicked and spreads into the card, with width leading and height following.
  - One critically damped spring drives every layer (shell, shadow plate, bead, content) on one clock. Open settles in about 220 ms and close in about 360 ms.
  - Only transform and opacity move. The shadow is its own plate, so nothing is ever clipped.
  - A click mid-flight reverses it, carrying position and speed.
  - The content surfaces after the shell has formed, un-blurring as it arrives.
  - There is no gold meniscus rim.
  - Reference implementation: `console/qa/lab/pours.js`, candidate A.
- **Soft close (Gate A):** exits behave like a luxury car door. They travel, then are pulled gently shut, decelerating into rest; they never accelerate out.
  - Tokens: `--ease-soft-close` `cubic-bezier(.4,0,.1,1)` over `--t-exit` 380 ms. Entry stays fast (`--t-enter` 200 ms, `--ease-out`).
- **Blur transition (Gate A, Duke):** a light blur accompanies entry (`--blur-enter` 4px) and exit (`--blur-exit` 3px). It is the one sanctioned exception to "transform and opacity only", and it has limits:
  - small surfaces only (menus, cards, toasts, tips, the pour's content);
  - enter and exit only, on the moving layer;
  - `filter:none` at rest, and never in loops;
  - never on the docs viewer, the full-screen map, large sheets or streamed words.
- **The vocabulary (Gate A):**
  - durations: `--t-instant` 90, `--t-enter` 200, `--t-exit` 380, `--t-move` 380, `--t-draw` 420 ms × length;
  - curves: `--ease-out`, `--ease-soft-close` and `--ease-inout`;
  - one critically damped `--spring`;
  - `--stagger` 40 ms.

  Nothing overshoots anywhere. The source is `console/qa/lab/tokens.proposed.css`, which becomes `src/tokens.css`.

## 4. Build habits

- **Master-template layout:** a wide thread with a 72-character prose measure, and a dock with the composer controls underneath it.
- **Performance budgets:**
  - animate transform and opacity only;
  - one requestAnimationFrame loop per map, asleep when idle;
  - DOM updates by diff;
  - no layout reads inside animation loops.
- **Build workflow (v41):** edit `console/src/`, never `index.html`; `build.py` assembles the page and refuses duplicate ids or a selector defined in two units. Prove refactors with `qa/styles.js` (computed styles) and `qa/diff.js` (pixels) against a baseline, and ship only on a 0-error smoke test.
- **Tokens (v41):** every value comes from `src/tokens.css`. Spacing is a 4px scale with half steps (`--sp-half`, `--sp-1h` … `--sp-4h`) below 20px for dense chrome; a 1px nudge is optical and stays literal. Layers are named (`--z-side`, `--z-menu`, `--z-tip` …) in one stacking order. Dark tokens are written once in `@dark{}`.

## 5. Change log
- **v42** (2026-09-26, after Amadeus's Gate B notes):
  - disclosures open and close on one timeline: the card's frame is drawn as a top cap, a band scaled on Y and a bottom cap that travels, so the frame follows the edge; what sits below moves with the same curve; each line of the body rises in as the edge passes it and, on the way back, fades just before the edge reaches it; a container's own drawing (a rail) shows only once it is wholly inside. No line is ever drawn outside the card. Transform and opacity only;
  - one fixed place for details: the Details rail, docked on the right, where the chat makes room for it. A hover or focus previews (citations, ledger rows, sources, map nodes with live numbers, the token raster readout, chat previews); a click pins, with the back stack for going deeper; the pinned item's own hover never re-previews it; with nothing pinned the last preview stays so its links can be followed. It steps aside for the Dispatch and sits beside the full-screen map. Short control labels stay beside their control. On a narrow window hovers keep their small cards and only a click opens the rail.
- **v41 shipped** (2026-09-26, Phase 4 review and republish):
  - every disclosure (run card, log, exhibits, folders) opens by showing the body as it rises and closes by fading it on `--t-exit` with the soft close; in both directions what sits below glides to its new place with FLIP, transform only;
  - the mercury slide, the lightbox, the greeting, the thumbnails and the composer's focus lift move only transform and opacity; the composer's lift is its own shadow plate fading in;
  - the ready light breathes three times and rests, and nothing loops while the page is settled (`qa/perf.js`);
  - small gold text uses `--gold-ink`, which clears AA; quiet text on hovered or chosen rows uses `--soft`; message actions are no longer dimmed.
- **v41 Phase 3** (2026-09-26, the build):
  - the maps are one canvas plate each, drawn from one timed graph, with the numbers, focus and tooltips in the DOM; one rAF loop per map that sleeps when idle;
  - the token raster replaces the spectrogram: five fixed token classes per quarter second, thinking drawn as dotted cells, painted only when a frame arrives;
  - blur is kept to small surfaces (menus, cards, toasts, tips); streamed words, headings, exhibits and the ledger rise with transform and opacity;
  - nothing overshoots: the document sheet and caret settle on the critically damped spring; the live-label sheen, swell and caret are transform or opacity only;
  - the palette highlight follows the pointer and the keys without redrawing, and every control audited (`qa/hovers.js`) has hover, press and focus states;
  - storage goes through one adapter, with export and import of the whole library, and no built-in name.
- **v41 Gate A** (2026-09-25; decisions only, the build follows):
  - the pour is the surface-tension droplet, with no meniscus rim;
  - exits are a luxury soft close with a light blur transition;
  - the motion vocabulary is five durations, three curves and one critically damped spring;
  - the colour tokens are tied to the brand stack, with AA text in both themes and a validated chart palette;
  - the spectrogram becomes a token raster;
  - chats get per-viewer storage (see REBUILD_PLAN);
  - "Decision agent" is relabelled Arbiter, and the orchestrator shows its real effort;
  - the start page's hidden WebGL loop is removed and the grain is rendered once.
- **v40:**
  - the console's orchestrator plans, staffs and decides at high effort; desks run high by default and medium only for low-level work;
  - the decision desk is folded into the orchestrator.
- **v39** (built on v37; v38 was reverted):
  - menus and sheets pour open with a rippling liquid crest, tinted while moving, content revealed in the wake;
  - clip-path reveals end past the shadow;
  - a transform-only indicator in the settings nav;
  - web research through Exa.
