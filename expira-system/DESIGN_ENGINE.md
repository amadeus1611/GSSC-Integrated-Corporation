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
- **Full palette (2026-09-26, Amadeus).** Ten colours; the values and their roles are in `brand_assets/palette.json`. Those marked "estimated" were read from a screenshot; replace them with the Canva hex codes.
  - Golds: light gold `#C9A35C`, deep gold `#AE8A47`, pale gold `#E9CF91`, sand `#E6D3A6`.
  - Navies: midnight navy `#0B1A3F`, royal navy `#0C2461`.
  - Neutrals: off-white `#F7F5F0`, light grey `#D9D9D9`, steel grey `#7D838E`, slate grey `#4D535E`.
  - **Dark theme (v45 draft):**
    - Surfaces are close to black, built from the brand ink rather than neutral grey: the sidebar is `#04060B` and the page is `#06090F`, stepping up to `#0C111B` for menus.
    - The default text is the off-white.
    - Captions use steel grey, which passes AA on every dark surface.
    - It is drafted in `console/bench/drafts/dark-next.css` and is promoted by replacing the `@dark` block in `src/tokens.css`.
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
- **The bloom (v44, replaces the v41 pour).** A surface opens where it lives: it comes out of a soft blur, fades up and settles from a hair under full size (0.965 small, 0.985 large) on `--t-enter` and `--ease-out`. It closes in place on the soft close, fading, easing a hair smaller and softening back into the blur. It never travels to or from the click point. The blur is gone by 70% of the way open, so the landing is sharp. Reversal mid-flight carries on from where it is. Source: `console/src/core/pour.js` (the `POUR.attach` API is unchanged).
- **The pour (Gate A, v41; retired in v44): the surface-tension droplet.**
  - A small bead leaves the exact point clicked and spreads into the card, with width leading and height following.
  - One critically damped spring drives every layer (shell, shadow plate, bead, content) on one clock. Open settles in about 220 ms and close in about 360 ms.
  - Only transform and opacity move. The shadow is its own plate, so nothing is ever clipped.
  - A click mid-flight reverses it, carrying position and speed.
  - The content surfaces after the shell has formed, un-blurring as it arrives.
  - There is no gold meniscus rim.
  - Reference implementation: `console/qa/lab/pours.js`, candidate A.
- **Soft close (Gate A):** exits behave like a luxury car door. They travel, then are pulled gently shut, decelerating into rest; they never accelerate out.
  - Tokens: `--ease-soft-close` `cubic-bezier(.4,0,.1,1)` over `--t-exit` 280 ms (380 before v44). Entry stays fast (`--t-enter` 160 ms, 200 before v44, `--ease-out`). Amadeus's rule: fast push, slower soft close. Most design systems close faster than they open (Material, NN/g, Atlassian); EXPIRA deliberately keeps the close a little slower, but both stay well under the 400 ms where motion reads as waiting.
- **Blur transition (Gate A, Duke; widened in v44 by Amadeus):** a blur accompanies entry (`--blur-enter` 8px) and exit (`--blur-exit` 6px). It is the one sanctioned exception to "transform and opacity only", and it has limits:
  - small surfaces blur as a whole; large surfaces (settings, the full-screen map, the document viewer) blur only their content, at `--blur-enter-lg` 6px and `--blur-exit-lg` 5px, because a blur costs in proportion to area × radius (Chrome, "Animating a blur"). A large surface that drops frames on a real device falls back to fade and scale;
  - enter and exit only, on the moving layer;
  - `filter:none` at rest, and never in loops;
  - never on streamed words.
- **The vocabulary (Gate A):**
  - durations: `--t-instant` 90, `--t-enter` 160, `--t-exit` 280, `--t-move` 300, `--t-draw` 420 ms × length (v44);
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
- **v45 draft, in the bench only** (2026-09-26, Amadeus's sidebar notes; `console/bench/sidebar-next.html`; nothing is promoted yet):
  - the sidebar follows Claude's structure: New chat and Search, then the master template's numbered sections, I Files (folders), II Pinned and III Recents;
  - rows are 28px, one hairline apart;
  - no shortcut hints and no Dispatch;
  - settings open from the account pull-up at the foot;
  - motion:
    - one highlight glides between rows on the spring;
    - hovers arrive on `--t-instant` and leave on the soft close;
    - a folder or section opens as one move: the rows below FLIP while each child surfaces from a light blur as it is uncovered, and the guide line draws with them; closing reverses it;
  - the dark theme is near black with off-white text, on the full palette above.
- **v44** (2026-09-26, Amadeus's super plan, `console/SUPER_PLAN.md`):
  - faster and softer: entry 160 ms, the soft close 280 ms, layout moves 300 ms;
  - the pour is retired: cards, menus, settings, the full-screen map and the document open by blooming out of a blur in place and close back into it, never returning to the click point; large surfaces blur their content only;
  - the full-screen map has one side pane with linked tabs: Details (the Details rail docks inside while full screen is open), Weighing (the ledger) and Log. A click on a node, claim or source opens Details there; a desk's details link to its lines in the log, and a log line naming a desk opens that desk. The map opens already drawn instead of replaying;
  - in full screen the columns spread wider, and what is out of focus dims to 42% instead of 20%, so labels stay readable;
  - settings: clicking the open tab no longer rebuilds it; the start page's preset briefs are gone; every run card opens on the log;
  - the Details rail swaps content with a short blur cross-fade instead of a sliding spring.
- **v43** (2026-09-26, after Amadeus's notes on the sidebar, card stutter and repeated Enter):
  - layout moves are one continuous move (after Amadeus's v55 notes: the transform-only version re-wrapped the text before or after the move, which read as a jump). The sidebar's margin and the chat's margin run on the time and curve of the panel that causes them (the sidebar on --ease-inout; the Details rail and the Dispatch on the spring as they arrive and the soft close as they leave), so the chat column, its text and the composer travel with the panel frame by frame. On a wide window the rail and the Dispatch come in from past the edge, so the panel's edge and the chat's edge move together. The fold button and the title FLIP against where the layout starts, on the same curve, so their path is one line. This is a deliberate exception to "transform and opacity only": the chat's own width is what moves;
  - the sidebar header keeps the fold button's height after the button leaves it, so the items below never jump up;
  - the Dispatch always opens: with nothing filed yet it shows a quiet page saying what will appear there, with a Write a brief button; its maps wake after the panel lands;
  - Enter: the brief shows and the run goes busy on the same frame; the kernel loads after. A held or repeated Enter cannot start a second run, and an empty Enter during a run does nothing (Stop or Esc stops it).
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
