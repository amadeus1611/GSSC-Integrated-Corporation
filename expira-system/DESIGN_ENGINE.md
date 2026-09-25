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

## 4. Build habits

- **Master-template layout:** a wide thread with a 72-character prose measure, and a dock with the composer controls underneath it.
- **Performance budgets:**
  - animate transform and opacity only;
  - one requestAnimationFrame loop per map, asleep when idle;
  - DOM updates by diff;
  - no layout reads inside animation loops.
- **Build workflow:** patch modules on top of a base build, with anchored replacements and a smoke test before shipping.

## 5. Change log
- **v40:**
  - the console's orchestrator plans, staffs and decides at high effort; desks run high by default and medium only for low-level work;
  - the decision desk is folded into the orchestrator.
- **v39** (built on v37; v38 was reverted):
  - menus and sheets pour open with a rippling liquid crest, tinted while moving, content revealed in the wake;
  - clip-path reveals end past the shadow;
  - a transform-only indicator in the settings nav;
  - web research through Exa.
