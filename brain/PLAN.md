# EXPIRA Console: the master plan (cross-analysis after v38.4)

Internal register. Each phase ships only when it is finished and verified: screenshots, per-frame numbers, and two clean smoke runs. Research is built into every item; it is never skipped or deferred until asked.

## Phase A · Motion system unification (next)
1. **One easing table** for the whole console, following Emil Kowalski's standards:
   - ease-out `cubic-bezier(.23,1,.32,1)` for enter and exit;
   - ease-in-out `(.77,0,.175,1)` for movement on screen;
   - UI motion ≤300ms, except the liquid shells.
   Audit every `transition` and `@keyframes` and replace the leftovers, such as `blurIn` with its filter blur, `evIn`, `swell`, `tick` and `halo`.
2. **Press feedback** on every button: scale .97 over 120ms, released over 200ms. Hover gated behind `(hover:hover)`.
3. **Keyboard openings** (the palette, shortcuts) open instantly, with no animation, as Raycast does. The research is clear on this.

## Phase B · The map system as one instrument
1. **Flow and Field share one legend and one type scale.** The full-screen Flow gets a time scrubber: drag to replay up to any moment, with the now card following the scrub.
2. **Field full screen** gets faint zone labels (Plan · Staffing · Desks · Search · Out) placed along the seq x axis, plus edge-type keys.
3. **The now card:**
   - hovering a strip segment previews that step;
   - clicking it opens its sheet;
   - a finished run shows a critical-path line (the chain that set the finish time).
4. **The mini map:** hovering a step shows its readout line in place; clicking it opens the sheet (keep).

## Phase C · Charts to master-template grade
1. Use the full pattern vocabulary from the kernel (vertical rule, grid hatch) per series, so charts survive monochrome print.
2. Apply the kernel's type scale to charts: 5.8 ticks, 6.4 series, 7.0 values, 7.6 titles, scaled for screen.
3. Add selective direct labels (the maximum and the last value) and an annotation hairline for the key figure.
4. Entrances with no bounce: bars rise on ease-out, lines draw on, donuts sweep, all staggered 40ms.

## Phase D · Composer and thread
1. Unify all input text (the composer, the palette, search, inline rename): 13px weight 300 at rest and when focused, with placeholders identical to the typed text.
2. **Thread density:**
   - message spacing on an 8px rhythm;
   - quieter bylines;
   - the footer stamp aligned to the prose measure.
3. **Attachment tray:** thumbnails get a pour-in, and removal drains out, using the same liquid engine.

## Phase E · Performance and hygiene
1. Field `setAttribute` writes stay ≤40k per run; replace the subtree MutationObservers with targeted ones; cut the welcome-screen idle CPU (lower the GOO loop rate, stop the grain interval).
2. Retire the dead v37 code paths the modules now shadow: the pour observer, the old sheen, and the old lens CSS. Fold the modules into a v39 base so the build chain stays short.

## Phase F · Brain and repo
1. After each iteration: update `BRAIN.md`, covering short-term memory, reinforced habits and retired habits.
2. Keep `DESIGN_ENGINE.md` as the canon and log each change to it.
3. Prune stale plans (`NEXT_PLAN.md` is superseded by this file).
